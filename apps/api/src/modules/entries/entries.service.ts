import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, LessThanOrEqual, Not, Repository } from 'typeorm';
import type { IEntrySnapshot } from '@raco/shared';
import { Entry } from './entry.entity';
import { EntryRevision } from './entry-revision.entity';

export interface Author {
  id: number;
  email: string;
}

// Cuántas versiones se guardan por entrada (las más viejas se descartan)
const MAX_REVISIONS = 50;

// Fechas de programación: llegan como texto ISO desde el panel; vacío = sin programar
function toDate(value: unknown, field: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`Fecha inválida en ${field}`);
  return d;
}

// MySQL reordena las claves de las columnas JSON: para comparar versiones hay que ordenarlas
function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableJson(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

const snapshotOf = (e: Entry): IEntrySnapshot => ({
  title: e.title,
  slug: e.slug,
  status: e.status,
  data: e.data,
  terms: e.terms,
  seoData: e.seoData,
  blocks: e.blocks,
});

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private repo: Repository<Entry>,
    @InjectRepository(EntryRevision)
    private revisions: Repository<EntryRevision>,
  ) {}

  findByCollection(collectionId: string, status?: string) {
    const where: any = { collectionId };
    if (status) where.status = status;
    return this.repo.find({ where, order: { updatedAt: 'DESC' } });
  }

  async findOne(collectionId: string, id: number) {
    const entry = await this.repo.findOne({ where: { id, collectionId } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    return entry;
  }

  findBySlug(collectionId: string, slug: string) {
    return this.repo.findOne({ where: { collectionId, slug } });
  }

  async create(data: Partial<Entry>, author?: Author) {
    const collectionId = data.collectionId!;
    const slug = await this.uniqueSlug(collectionId, data.slug || data.title || 'entrada');

    const publishAt = toDate(data.publishAt, 'publishAt') ?? null;
    const entry = await this.repo.save(
      this.repo.create({
        ...data,
        slug,
        publishAt: data.status === 'published' ? null : publishAt,
        unpublishAt: toDate(data.unpublishAt, 'unpublishAt') ?? null,
        data: data.data ?? {},
        terms: data.terms ?? {},
        seoData: data.seoData ?? { title: '', description: '', noIndex: false },
      }),
    );
    await this.record(entry, 'Creada', author);
    return entry;
  }

  async update(collectionId: string, id: number, data: Partial<Entry>, author?: Author, note?: string) {
    const entry = await this.findOne(collectionId, id);
    const before = entry.status;
    // id y colección no se cambian desde el body
    const { id: _id, collectionId: _col, createdAt, updatedAt, ...changes } = data;

    if (changes.slug !== undefined && changes.slug !== entry.slug) {
      changes.slug = await this.uniqueSlug(collectionId, changes.slug || changes.title || entry.title, id);
    }

    const publishAt = toDate(data.publishAt, 'publishAt');
    const unpublishAt = toDate(data.unpublishAt, 'unpublishAt');
    if (publishAt !== undefined) changes.publishAt = publishAt;
    if (unpublishAt !== undefined) changes.unpublishAt = unpublishAt;
    // Si ya queda publicada, la publicación programada sobra
    if ((changes.status ?? entry.status) === 'published') changes.publishAt = null;

    const saved = await this.repo.save({ ...entry, ...changes });
    const auto =
      saved.status !== before
        ? saved.status === 'published'
          ? 'Publicada'
          : before === 'published'
            ? 'Despublicada'
            : 'Editada'
        : 'Editada';
    await this.record(saved, note ?? auto, author);
    return saved;
  }

  // --- Programación ---

  // Publica lo que llegó a su hora y despublica lo que venció. La llama el SchedulerService.
  async runSchedule(now = new Date()) {
    const due = await this.repo.find({ where: { publishAt: LessThanOrEqual(now), status: Not('published') } });
    for (const e of due) {
      await this.update(e.collectionId, e.id, { status: 'published', publishAt: null }, undefined, 'Publicada (programada)');
    }

    const expired = await this.repo.find({ where: { unpublishAt: LessThanOrEqual(now), status: 'published' } });
    for (const e of expired) {
      await this.update(e.collectionId, e.id, { status: 'draft', unpublishAt: null }, undefined, 'Despublicada (programada)');
    }
    return { published: due.length, unpublished: expired.length };
  }

  // --- Historial ---

  // Guarda una versión si cambió algo respecto a la última, y descarta las que sobran
  private async record(entry: Entry, note: string, author?: Author) {
    const snapshot = snapshotOf(entry);
    const last = await this.revisions.findOne({ where: { entryId: entry.id }, order: { id: 'DESC' } });
    if (last && stableJson(last.snapshot) === stableJson(snapshot)) return;

    await this.revisions.save(
      this.revisions.create({
        entryId: entry.id,
        snapshot,
        note,
        authorId: author?.id ?? null,
        authorEmail: author?.email ?? null,
      }),
    );

    const keep = await this.revisions.find({
      where: { entryId: entry.id },
      order: { id: 'DESC' },
      skip: MAX_REVISIONS - 1,
      take: 1,
      select: { id: true },
    });
    if (keep.length) await this.revisions.delete({ entryId: entry.id, id: LessThan(keep[0].id) });
  }

  async listRevisions(collectionId: string, id: number) {
    const entry = await this.findOne(collectionId, id);
    // Entradas anteriores al historial: su estado actual pasa a ser la primera versión
    if (!(await this.revisions.exists({ where: { entryId: id } }))) await this.record(entry, 'Versión inicial');
    return this.revisions.find({
      where: { entryId: id },
      order: { id: 'DESC' },
      select: { id: true, entryId: true, note: true, authorEmail: true, createdAt: true },
    });
  }

  async getRevision(collectionId: string, id: number, revisionId: number) {
    await this.findOne(collectionId, id);
    const revision = await this.revisions.findOne({ where: { id: revisionId, entryId: id } });
    if (!revision) throw new NotFoundException('Versión no encontrada');
    return revision;
  }

  async restore(collectionId: string, id: number, revisionId: number, author?: Author) {
    const revision = await this.getRevision(collectionId, id, revisionId);
    return this.update(collectionId, id, { ...revision.snapshot }, author, `Restaurada desde la versión #${revision.id}`);
  }

  async remove(collectionId: string, id: number) {
    const entry = await this.findOne(collectionId, id);
    return this.repo.remove(entry);
  }

  // Igual que WordPress: si el slug ya existe en la colección se le agrega -2, -3...
  private async uniqueSlug(collectionId: string, base: string, excludeId?: number) {
    const root = slugify(base) || 'entrada';
    let slug = root;
    let n = 2;

    while (
      await this.repo.exists({
        where: { collectionId, slug, ...(excludeId ? { id: Not(excludeId) } : {}) },
      })
    ) {
      slug = `${root}-${n++}`;
    }
    return slug;
  }
}
