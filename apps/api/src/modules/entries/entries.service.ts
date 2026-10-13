import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Entry } from './entry.entity';

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

  async create(data: Partial<Entry>) {
    const collectionId = data.collectionId!;
    const slug = await this.uniqueSlug(collectionId, data.slug || data.title || 'entrada');

    return this.repo.save(
      this.repo.create({
        ...data,
        slug,
        data: data.data ?? {},
        terms: data.terms ?? {},
        seoData: data.seoData ?? { title: '', description: '', noIndex: false },
      }),
    );
  }

  async update(collectionId: string, id: number, data: Partial<Entry>) {
    const entry = await this.findOne(collectionId, id);
    // id y colección no se cambian desde el body
    const { id: _id, collectionId: _col, createdAt, updatedAt, ...changes } = data;

    if (changes.slug !== undefined && changes.slug !== entry.slug) {
      changes.slug = await this.uniqueSlug(collectionId, changes.slug || changes.title || entry.title, id);
    }

    return this.repo.save({ ...entry, ...changes });
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
