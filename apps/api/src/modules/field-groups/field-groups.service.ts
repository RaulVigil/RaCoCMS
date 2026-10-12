import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FieldGroup } from './field-group.entity';

@Injectable()
export class FieldGroupsService {
  constructor(
    @InjectRepository(FieldGroup)
    private repo: Repository<FieldGroup>,
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

  create(data: Partial<FieldGroup>) {
    return this.repo.save(this.repo.create({ ...data, fields: data.fields ?? [] }));
  }

  async update(id: number, data: Partial<FieldGroup>) {
    const group = await this.repo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Grupo de campos no encontrado');
    return this.repo.save({ ...group, ...data });
  }

  async remove(id: number) {
    const group = await this.repo.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Grupo de campos no encontrado');
    return this.repo.remove(group);
  }
}
