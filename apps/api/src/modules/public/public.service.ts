import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { IMenuItem } from '@raco/shared';
import { Entry } from '../entries/entry.entity';
import { Collection } from '../collections/collection.entity';
import { FieldGroup } from '../field-groups/field-group.entity';
import { Setting } from '../settings/setting.entity';
import { GlobalPart } from '../global-parts/global-part.entity';
import { Menu } from '../menus/menu.entity';
import { Template } from '../templates/template.entity';

// Lectura pública para el front: solo contenido publicado, nunca borradores ni archivados
@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Entry) private entries: Repository<Entry>,
    @InjectRepository(Collection) private collections: Repository<Collection>,
    @InjectRepository(FieldGroup) private fieldGroups: Repository<FieldGroup>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
    @InjectRepository(GlobalPart) private parts: Repository<GlobalPart>,
    @InjectRepository(Menu) private menus: Repository<Menu>,
    @InjectRepository(Template) private templates: Repository<Template>,
  ) {}

  // Todo lo común a cualquier página: ajustes, header, footer y menús (con sus URLs ya resueltas)
  async site() {
    const [rows, parts, menus] = await Promise.all([this.settings.find(), this.parts.find(), this.menus.find()]);
    const value = (key: string) => rows.find((r) => r.key === key)?.value ?? null;
    const general = value('general') as { homePageId?: number } | null;
    const part = (id: string) => parts.find((p) => p.id === id);

    return {
      general,
      design: value('design'),
      header: { blocks: part('header')?.blocks ?? [], sticky: !!part('header')?.sticky },
      footer: { blocks: part('footer')?.blocks ?? [] },
      menus: await this.resolveMenus(menus, general?.homePageId ?? null),
    };
  }

  // Los enlaces a entradas se guardan por id: aquí se calcula su URL actual.
  // Si la entrada ya no está publicada, el enlace se quita en vez de quedar roto.
  private async resolveMenus(menus: Menu[], homePageId: number | null) {
    const ids = new Set<number>();
    const collect = (items: IMenuItem[]) =>
      items.forEach((i) => {
        if (i.ref) ids.add(i.ref.entryId);
        collect(i.children ?? []);
      });
    menus.forEach((m) => collect(m.items));

    const published = ids.size
      ? await this.entries.find({
          where: { id: In([...ids]), status: 'published' },
          select: { id: true, slug: true, collectionId: true },
        })
      : [];
    const urlOf = new Map(
      published.map((e) => [
        e.id,
        e.id === homePageId ? '/' : e.collectionId === 'pages' ? `/${e.slug}` : `/${e.collectionId}/${e.slug}`,
      ]),
    );

    const resolve = (items: IMenuItem[]): IMenuItem[] =>
      items
        .filter((i) => !i.ref || urlOf.has(i.ref.entryId))
        .map((i) => ({ ...i, url: i.ref ? urlOf.get(i.ref.entryId)! : i.url, children: resolve(i.children ?? []) }));

    return menus.map((m) => ({ id: m.id, name: m.name, items: resolve(m.items) }));
  }

  listCollections() {
    return this.collections.find({
      select: { id: true, name: true, isNative: true, useBuilder: true },
      order: { name: 'ASC' },
    });
  }

  async listEntries(collectionId: string, page = 1, limit = 12) {
    const collection = await this.collections.findOne({ where: { id: collectionId } });
    if (!collection) throw new NotFoundException('Colección no encontrada');

    const take = Math.min(Math.max(limit, 1), 50);
    const [items, total] = await this.entries.findAndCount({
      where: { collectionId, status: 'published' },
      select: { id: true, title: true, slug: true, data: true, seoData: true, createdAt: true, updatedAt: true },
      order: { createdAt: 'DESC' },
      skip: (Math.max(page, 1) - 1) * take,
      take,
    });
    const template = await this.templates.findOne({ where: { collectionId, type: 'archive' } });
    return { collection, items, total, page, totalPages: Math.ceil(total / take), template };
  }

  async entry(collectionId: string, slug: string) {
    const entry = await this.entries.findOne({ where: { collectionId, slug, status: 'published' } });
    if (!entry) throw new NotFoundException('Página no encontrada');
    return this.withContext(entry);
  }

  async home() {
    const general = (await this.settings.findOne({ where: { key: 'general' } }))?.value as { homePageId?: number } | undefined;
    if (!general?.homePageId) return null;
    const entry = await this.entries.findOne({ where: { id: general.homePageId, collectionId: 'pages', status: 'published' } });
    return entry ? this.withContext(entry) : null;
  }

  // Lo que el sitemap necesita: URLs publicadas e indexables
  async sitemap() {
    const rows = await this.entries.find({
      where: { status: 'published' },
      select: { collectionId: true, slug: true, updatedAt: true, seoData: true, id: true },
    });
    const collections = await this.collections.find({ select: { id: true, isNative: true } });
    return {
      entries: rows
        .filter((e) => !e.seoData?.noIndex)
        .map((e) => ({ id: e.id, collectionId: e.collectionId, slug: e.slug, updatedAt: e.updatedAt })),
      archives: collections.filter((c) => !c.isNative).map((c) => c.id),
    };
  }

  // La entrada con su colección y sus grupos de campos (para la plantilla genérica)
  private async withContext(entry: Entry) {
    const [collection, fieldGroups, template] = await Promise.all([
      this.collections.findOne({ where: { id: entry.collectionId } }),
      this.fieldGroups.find({ where: { collectionId: entry.collectionId } }),
      this.templates.findOne({ where: { collectionId: entry.collectionId, type: 'single' } }),
    ]);
    return { entry, collection, fieldGroups, template };
  }
}
