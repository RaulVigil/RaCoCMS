import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private repo: Repository<Menu>,
  ) {}

  findAll() {
    return this.repo.find();
  }

  findOne(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  create(data: Partial<Menu>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<Menu>) {
    const menu = await this.repo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    return this.repo.save({ ...menu, ...data });
  }

  async remove(id: string) {
    const menu = await this.repo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    return this.repo.remove(menu);
  }
}
