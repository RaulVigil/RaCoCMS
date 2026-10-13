import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Taxonomy } from './taxonomy.entity';

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
export class TaxonomiesService {
  constructor(
    @InjectRepository(Taxonomy)
    private repo: Repository<Taxonomy>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  findByCollection(collectionId: string) {
    return this.repo.find({ where: { collectionId }, order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const taxonomy = await this.repo.findOne({ where: { id } });
    if (!taxonomy) throw new NotFoundException('Taxonomía no encontrada');
    return taxonomy;
  }

  async create(data: Partial<Taxonomy>) {
    // El id sale del nombre si no viene ("Estados del viaje" -> "estados-del-viaje")
    const id = slugify(data.id || data.name || '');
    if (!id) throw new ConflictException('La taxonomía necesita un nombre');

    // save() con un id existente lo sobrescribiría, así que se comprueba antes
    if (await this.repo.exists({ where: { id } })) {
      throw new ConflictException(`Ya existe una taxonomía con el identificador "${id}"`);
    }

    return this.repo.save(this.repo.create({ ...data, id, terms: data.terms ?? [] }));
  }

  async update(id: string, data: Partial<Taxonomy>) {
    const taxonomy = await this.findOne(id);
    const { id: _id, createdAt, updatedAt, ...changes } = data;
    return this.repo.save({ ...taxonomy, ...changes });
  }

  async remove(id: string) {
    const taxonomy = await this.findOne(id);
    return this.repo.remove(taxonomy);
  }
}
