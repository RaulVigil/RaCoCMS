import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private repo: Repository<Collection>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Collection>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Collection>) {
    const collection = await this.repo.findOne({ where: { id } });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return this.repo.save({ ...collection, ...data });
  }

  async remove(id: string) {
    const collection = await this.repo.findOne({ where: { id } });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return this.repo.remove(collection);
  }
}
