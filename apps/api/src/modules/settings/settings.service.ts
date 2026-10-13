import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ISiteDesign } from '@raco/shared';
import { Setting } from './setting.entity';

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const COLOR_ID = /^(primary|secondary|tertiary|background|c-[a-z0-9]{3,10})$/;
const FONT = /^[A-Za-z0-9 ]{2,60}$/;

// Solo se aceptan claves conocidas, cada una con su validación
const validators: Record<string, (value: unknown) => unknown> = {
  design: (value) => {
    const d = value as Partial<ISiteDesign>;
    if (!Array.isArray(d?.colors) || !d.fonts) throw new BadRequestException('Diseño inválido');
    const colors = d.colors
      .filter((c) => COLOR_ID.test(c?.id) && HEX.test(c?.value))
      .map((c) => ({ id: c.id, name: String(c.name ?? '').slice(0, 40), value: c.value.toLowerCase() }));
    if (!FONT.test(d.fonts.heading) || !FONT.test(d.fonts.body)) throw new BadRequestException('Fuente inválida');
    return { colors, fonts: { heading: d.fonts.heading, body: d.fonts.body } };
  },
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private repo: Repository<Setting>,
  ) {}

  async get(key: string) {
    this.assertKey(key);
    const row = await this.repo.findOne({ where: { key } });
    return { key, value: row?.value ?? null };
  }

  async set(key: string, value: unknown) {
    this.assertKey(key);
    const clean = validators[key](value);
    await this.repo.save({ key, value: clean });
    return { key, value: clean };
  }

  private assertKey(key: string) {
    if (!validators[key]) throw new BadRequestException(`Ajuste desconocido: ${key}`);
  }
}
