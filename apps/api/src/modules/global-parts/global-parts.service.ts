import { ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalPart } from './global-part.entity';
import { defaultFooter, defaultHeader } from './default-parts';

// Header y footer son partes del sistema: siempre existen y no se pueden borrar
const NATIVE = ['header', 'footer'];

@Injectable()
export class GlobalPartsService implements OnModuleInit {
  constructor(
    @InjectRepository(GlobalPart)
    private repo: Repository<GlobalPart>,
  ) {}

  async onModuleInit() {
    if (!(await this.repo.exists({ where: { id: 'header' } }))) {
      await this.repo.save(this.repo.create({ id: 'header', name: 'Cabecera', blocks: defaultHeader, sticky: true }));
    }
    if (!(await this.repo.exists({ where: { id: 'footer' } }))) {
      await this.repo.save(this.repo.create({ id: 'footer', name: 'Pie de página', blocks: defaultFooter }));
    }
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: string) {
    const part = await this.repo.findOne({ where: { id } });
    if (!part) throw new NotFoundException('Parte global no encontrada');
    return part;
  }

  create(data: Partial<GlobalPart>) {
    return this.repo.save(this.repo.create({ ...data, blocks: data.blocks ?? [] }));
  }

  async update(id: string, data: Partial<GlobalPart>) {
    const part = await this.findOne(id);
    const { id: _id, createdAt, updatedAt, ...changes } = data;
    return this.repo.save({ ...part, ...changes });
  }

  async remove(id: string) {
    if (NATIVE.includes(id)) throw new ForbiddenException('El header y el footer no se pueden eliminar');
    const part = await this.findOne(id);
    return this.repo.remove(part);
  }
}
