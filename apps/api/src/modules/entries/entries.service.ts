import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Entry } from './entry.entity';

@Injectable()
export class EntriesService {
  constructor(
    @InjectRepository(Entry)
    private repo: Repository<Entry>,
  ) {}

  findByCollection(collectionId: string, status?: string) {
    const where: any = { collectionId };
    if (status) where.status = status;
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  findBySlug(collectionId: string, slug: string) {
    return this.repo.findOne({ where: { collectionId, slug } });
  }

  create(data: Partial<Entry>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Entry>) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    return this.repo.save({ ...entry, ...data });
  }

  async remove(id: number) {
    const entry = await this.repo.findOne({ where: { id } });
    if (!entry) throw new NotFoundException('Entrada no encontrada');
    return this.repo.remove(entry);
  }
}
