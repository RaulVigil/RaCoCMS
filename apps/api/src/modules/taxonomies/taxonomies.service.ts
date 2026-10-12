import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxonomy } from './taxonomy.entity';

@Injectable()
export class TaxonomiesService {
  constructor(
    @InjectRepository(Taxonomy)
    private repo: Repository<Taxonomy>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findByCollection(collectionId: string) {
    return this.repo.find({ where: { collectionId } });
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Taxonomy>) {
    return this.repo.save(this.repo.create({ ...data, terms: data.terms ?? [] }));
  }

  async update(id: string, data: Partial<Taxonomy>) {
    const taxonomy = await this.repo.findOne({ where: { id } });
    if (!taxonomy) throw new NotFoundException('Taxonomía no encontrada');
    return this.repo.save({ ...taxonomy, ...data });
  }

  async remove(id: string) {
    const taxonomy = await this.repo.findOne({ where: { id } });
    if (!taxonomy) throw new NotFoundException('Taxonomía no encontrada');
    return this.repo.remove(taxonomy);
  }
}
