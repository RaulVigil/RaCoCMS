import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

@Injectable()
export class MediaService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async processAndSave(file: Express.Multer.File) {
    const filename = `${Date.now()}-${file.originalname.replace(/\.[^.]+$/, '')}.webp`;
    const outputPath = path.join(this.uploadDir, filename);

    await sharp(file.buffer)
      .webp({ quality: 80 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);

    return {
      filename,
      originalName: file.originalname,
      size: stats.size,
      url: `/uploads/${filename}`,
      mimeType: 'image/webp',
    };
  }

  getFiles() {
    const files = fs.readdirSync(this.uploadDir);
    return files.map((file) => ({
      filename: file,
      url: `/uploads/${file}`,
    }));
  }

  deleteFile(filename: string) {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { deleted: true };
    }
    return { deleted: false, message: 'Archivo no encontrado' };
  }
}
