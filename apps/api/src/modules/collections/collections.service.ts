import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './collection.entity';

function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CollectionsService implements OnModuleInit {
  constructor(
    @InjectRepository(Collection)
    private repo: Repository<Collection>,
  ) {}

  // La colección nativa "Páginas" se crea en el primer arranque; su contenido se arma con el constructor
  async onModuleInit() {
    if (await this.repo.exists({ where: { id: 'pages' } })) {
      // Las páginas siempre se diseñan con el constructor
      await this.repo.update({ id: 'pages' }, { useBuilder: true });
      return;
    }

    await this.repo.save(
      this.repo.create({ id: 'pages', name: 'Páginas', schema: {}, isNative: true, useBuilder: true }),
    );
  }

  findAll() {
    return this.repo.find({ order: { isNative: 'DESC', name: 'ASC' } });
  }

  async findOne(id: string) {
    const collection = await this.repo.findOne({ where: { id } });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return collection;
  }

  async create(data: Partial<Collection>) {
    // El id es el segmento de la URL: sale del nombre si no viene ("Viajes de Lujo" -> "viajes-de-lujo")
    const id = slugify(data.id || data.name || '');
    if (!id) throw new ConflictException('La colección necesita un nombre');

    // save() con un id existente lo sobrescribiría, así que se comprueba antes
    if (await this.repo.exists({ where: { id } })) {
      throw new ConflictException(`Ya existe una colección con el identificador "${id}"`);
    }

    return this.repo.save(this.repo.create({ ...data, id, schema: data.schema ?? {}, isNative: false }));
  }

  async update(id: string, data: Partial<Collection>) {
    const collection = await this.findOne(id);
    const { id: _id, isNative, createdAt, updatedAt, ...changes } = data;
    return this.repo.save({ ...collection, ...changes });
  }

  async remove(id: string) {
    const collection = await this.findOne(id);
    if (collection.isNative) {
      throw new ForbiddenException(`"${collection.name}" es una colección del sistema y no se puede eliminar`);
    }
    return this.repo.remove(collection);
  }
}
