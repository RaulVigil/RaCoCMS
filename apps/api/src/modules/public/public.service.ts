import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from '../entries/entry.entity';
import { Collection } from '../collections/collection.entity';
import { FieldGroup } from '../field-groups/field-group.entity';
import { Setting } from '../settings/setting.entity';

// Lectura pública para el front: solo contenido publicado, nunca borradores ni archivados
@Injectable()
export class PublicService {
  constructor(
    @InjectRepository(Entry) private entries: Repository<Entry>,
    @InjectRepository(Collection) private collections: Repository<Collection>,
    @InjectRepository(FieldGroup) private fieldGroups: Repository<FieldGroup>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
  ) {}

  async site() {
    const rows = await this.settings.find();
    const value = (key: string) => rows.find((r) => r.key === key)?.value ?? null;
    return { general: value('general'), design: value('design') };
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
    return { collection, items, total, page, totalPages: Math.ceil(total / take) };
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
    const [collection, fieldGroups] = await Promise.all([
      this.collections.findOne({ where: { id: entry.collectionId } }),
      this.fieldGroups.find({ where: { collectionId: entry.collectionId } }),
    ]);
    return { entry, collection, fieldGroups };
  }
}
