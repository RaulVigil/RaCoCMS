import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Template } from './template.entity';

const TYPES = ['single', 'archive'];

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private repo: Repository<Template>,
  ) {}

  findAll() {
    return this.repo.find({ order: { collectionId: 'ASC', type: 'ASC' } });
  }

  findByCollection(collectionId: string) {
    return this.repo.find({ where: { collectionId } });
  }

  async findOne(id: number) {
    const template = await this.repo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    return template;
  }

  async create(data: Partial<Template>) {
    if (!data.collectionId) throw new BadRequestException('Falta la colección');
    const type = TYPES.includes(String(data.type)) ? data.type! : 'single';
    if (await this.repo.exists({ where: { collectionId: data.collectionId, type } })) {
      throw new ConflictException('Esa colección ya tiene una plantilla de este tipo');
    }
    return this.repo.save(
      this.repo.create({ name: data.name || 'Plantilla', collectionId: data.collectionId, type, blocks: data.blocks ?? [] }),
    );
  }

  // Solo cambian el nombre y el diseño: colección y tipo quedan fijos
  async update(id: number, data: Partial<Template>) {
    const template = await this.findOne(id);
    return this.repo.save({
      ...template,
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.blocks !== undefined ? { blocks: data.blocks } : {}),
    });
  }

  async remove(id: number) {
    const template = await this.findOne(id);
    return this.repo.remove(template);
  }
}
