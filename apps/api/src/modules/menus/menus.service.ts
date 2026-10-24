import { ConflictException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { IMenuItem } from '@raco/shared';
import { Menu } from './menu.entity';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const TYPES = ['custom', 'page', 'entry', 'archive'];
const UNSAFE_URL = /^\s*(javascript|data|vbscript):/i;

// Limpia lo que llega del panel: textos acotados, URLs sin esquemas peligrosos, máximo dos niveles
function cleanItems(items: unknown, depth = 0): IMenuItem[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, 50).map((raw, i) => {
    const it = (raw ?? {}) as Partial<IMenuItem>;
    const url = String(it.url ?? '').trim().slice(0, 500);
    const ref =
      it.ref && typeof it.ref.collectionId === 'string' && Number.isInteger(Number(it.ref.entryId))
        ? { collectionId: it.ref.collectionId.slice(0, 100), entryId: Number(it.ref.entryId) }
        : undefined;
    return {
      id: String(it.id || `m${Date.now().toString(36)}${i}`).slice(0, 40),
      label: String(it.label ?? '').trim().slice(0, 80) || 'Enlace',
      url: UNSAFE_URL.test(url) ? '#' : url || '#',
      type: (TYPES.includes(String(it.type)) ? it.type : 'custom') as IMenuItem['type'],
      target: it.target === '_blank' ? '_blank' : '_self',
      children: depth === 0 ? cleanItems(it.children, 1) : [],
      ...(ref ? { ref } : {}),
    };
  });
}

@Injectable()
export class MenusService implements OnModuleInit {
  constructor(
    @InjectRepository(Menu)
    private repo: Repository<Menu>,
  ) {}

  // El header por defecto usa el menú "main"
  async onModuleInit() {
    if (await this.repo.exists({ where: { id: 'main' } })) return;
    await this.repo.save(
      this.repo.create({
        id: 'main',
        name: 'Menú principal',
        items: [{ id: 'm-inicio', label: 'Inicio', url: '/', type: 'custom', target: '_self', children: [] }],
      }),
    );
  }

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const menu = await this.repo.findOne({ where: { id } });
    if (!menu) throw new NotFoundException('Menú no encontrado');
    return menu;
  }

  async create(data: Partial<Menu>) {
    const id = slugify(data.id || data.name || '');
    if (!id) throw new ConflictException('El menú necesita un nombre');
    if (await this.repo.exists({ where: { id } })) {
      throw new ConflictException(`Ya existe un menú con el identificador "${id}"`);
    }
    return this.repo.save(this.repo.create({ id, name: String(data.name ?? id).slice(0, 80), items: cleanItems(data.items) }));
  }

  async update(id: string, data: Partial<Menu>) {
    const menu = await this.findOne(id);
    return this.repo.save({
      ...menu,
      ...(data.name !== undefined ? { name: String(data.name).slice(0, 80) } : {}),
      ...(data.items !== undefined ? { items: cleanItems(data.items) } : {}),
    });
  }

  async remove(id: string) {
    const menu = await this.findOne(id);
    return this.repo.remove(menu);
  }
}
