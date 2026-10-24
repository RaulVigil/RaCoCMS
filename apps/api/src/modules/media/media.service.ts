import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import type { IMediaUsage } from '@raco/shared';
import { Media } from './media.entity';
import { Entry } from '../entries/entry.entity';
import { GlobalPart } from '../global-parts/global-part.entity';
import { Template } from '../templates/template.entity';
import { Setting } from '../settings/setting.entity';

// Las fotos de cámara o móvil pueden medir 6000 px: para la web sobra con esto
const MAX_WIDTH = 2400;
const IMAGE_EXT = /\.(webp|png|jpe?g|gif|avif|svg)$/i;

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly logger = new Logger('Multimedia');
  private readonly uploadDir = path.resolve(process.cwd(), 'uploads');
  private readonly maxBytes: number;

  constructor(
    config: ConfigService,
    @InjectRepository(Media) private repo: Repository<Media>,
    @InjectRepository(Entry) private entries: Repository<Entry>,
    @InjectRepository(GlobalPart) private parts: Repository<GlobalPart>,
    @InjectRepository(Template) private templates: Repository<Template>,
    @InjectRepository(Setting) private settings: Repository<Setting>,
  ) {
    this.maxBytes = (Number(config.get('MAX_FILE_SIZE_MB')) || 15) * 1024 * 1024;
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  // Archivos subidos antes de existir la biblioteca: se registran con sus dimensiones
  async onModuleInit() {
    const known = new Set((await this.repo.find({ select: { filename: true } })).map((m) => m.filename));
    const missing = fs.readdirSync(this.uploadDir).filter((f) => IMAGE_EXT.test(f) && !known.has(f));
    for (const filename of missing) {
      const file = path.join(this.uploadDir, filename);
      const meta = await sharp(file).metadata().catch(() => null);
      await this.repo.save(
        this.repo.create({
          filename,
          originalName: filename.replace(/^\d+-/, ''),
          url: `/uploads/${filename}`,
          mimeType: `image/${(path.extname(filename).slice(1) || 'webp').replace('jpg', 'jpeg')}`,
          size: fs.statSync(file).size,
          width: meta?.width ?? null,
          height: meta?.height ?? null,
        }),
      );
    }
    if (missing.length) this.logger.log(`Registradas ${missing.length} imágenes que ya estaban en /uploads`);
  }

  async processAndSave(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No llegó ningún archivo');
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) {
      throw new BadRequestException('Solo se pueden subir imágenes JPG, PNG, WebP, GIF o AVIF');
    }
    if (file.size > this.maxBytes) {
      throw new BadRequestException(`La imagen pesa más de ${Math.round(this.maxBytes / 1024 / 1024)} MB`);
    }

    // Multer entrega el nombre leído como latin1: "Fóto" llegaría como "FÃ³to"
    const original = Buffer.from(file.originalname, 'latin1').toString('utf8');

    // Nombre limpio: sin rutas ni caracteres raros, y con marca de tiempo para que nunca choque
    const base =
      path
        .basename(original)
        .replace(/\.[^.]+$/, '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^\w\s().-]/g, '')
        .trim()
        .slice(0, 80) || 'imagen';
    const filename = `${Date.now()}-${base}.webp`;
    const outputPath = path.join(this.uploadDir, filename);

    const info = await sharp(file.buffer)
      .rotate() // respeta la orientación de las fotos de móvil
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath)
      .catch(() => {
        throw new BadRequestException('No se pudo procesar la imagen (¿archivo dañado?)');
      });

    return this.repo.save(
      this.repo.create({
        filename,
        originalName: path.basename(original).slice(0, 255),
        url: `/uploads/${filename}`,
        mimeType: 'image/webp',
        size: info.size,
        width: info.width,
        height: info.height,
      }),
    );
  }

  async list(search = '', page = 1, limit = 60) {
    const take = Math.min(Math.max(limit, 1), 200);
    const q = search.trim();
    const [items, total] = await this.repo.findAndCount({
      where: q ? [{ originalName: Like(`%${q}%`) }, { alt: Like(`%${q}%`) }] : {},
      order: { id: 'DESC' },
      skip: (Math.max(page, 1) - 1) * take,
      take,
    });
    return { items, total, page, totalPages: Math.ceil(total / take) };
  }

  async findOne(id: number) {
    const media = await this.repo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Archivo no encontrado');
    return media;
  }

  async update(id: number, data: { alt?: string }) {
    const media = await this.findOne(id);
    if (data.alt !== undefined) media.alt = String(data.alt).trim().slice(0, 300);
    return this.repo.save(media);
  }

  // Busca la URL dentro del contenido guardado (entradas, header/footer, plantillas, ajustes)
  async usage(id: number): Promise<IMediaUsage[]> {
    const { url } = await this.findOne(id);
    const like = `%${url.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const inJson = (alias: string, cols: string[]) => cols.map((c) => `CAST(${alias}.${c} AS CHAR) LIKE :like`).join(' OR ');

    const [entries, parts, templates, settings] = await Promise.all([
      this.entries
        .createQueryBuilder('e')
        .select(['e.id', 'e.title', 'e.collectionId'])
        .where(inJson('e', ['data', 'blocks', 'seoData']), { like })
        .getMany(),
      this.parts.createQueryBuilder('p').select(['p.id', 'p.name']).where(inJson('p', ['blocks']), { like }).getMany(),
      this.templates.createQueryBuilder('t').select(['t.id', 't.name']).where(inJson('t', ['blocks']), { like }).getMany(),
      this.settings.createQueryBuilder('s').select(['s.key']).where(inJson('s', ['value']), { like }).getMany(),
    ]);

    return [
      ...entries.map((e) => ({ kind: 'entry' as const, id: e.id, title: e.title || '(sin título)', collectionId: e.collectionId })),
      ...parts.map((p) => ({ kind: 'global-part' as const, id: p.id, title: p.name })),
      ...templates.map((t) => ({ kind: 'template' as const, id: t.id, title: t.name })),
      ...settings.map((s) => ({ kind: 'settings' as const, id: s.key, title: 'Ajustes del sitio' })),
    ];
  }

  async remove(id: number) {
    const media = await this.findOne(id);
    const file = path.join(this.uploadDir, path.basename(media.filename));
    if (fs.existsSync(file)) fs.unlinkSync(file);
    await this.repo.remove(media);
    return { deleted: true };
  }
}
