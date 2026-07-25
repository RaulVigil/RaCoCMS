import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private repo: Repository<Template>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findByCollection(collectionId: string) {
    return this.repo.find({ where: { collectionId } });
  }

  findOne(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Template>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Template>) {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    return this.repo.save({ ...template, ...data });
  }

  async remove(id: number) {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    return this.repo.remove(template);
  }
}
