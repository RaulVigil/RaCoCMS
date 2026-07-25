import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlobalPart } from './global-part.entity';

@Injectable()
export class GlobalPartsService {
  constructor(
    @InjectRepository(GlobalPart)
    private repo: Repository<GlobalPart>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<GlobalPart>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<GlobalPart>) {
    const part = await this.repo.findOne({ where: { id } });
    if (!part) throw new NotFoundException('Parte global no encontrada');
    return this.repo.save({ ...part, ...data });
  }

  async remove(id: string) {
    const part = await this.repo.findOne({ where: { id } });
    if (!part) throw new NotFoundException('Parte global no encontrada');
    return this.repo.remove(part);
  }
}
