import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Cada archivo de /uploads con sus datos: dimensiones, peso y texto alternativo reutilizable
@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 191 })
  filename: string;

  @Column({ length: 255 })
  originalName: string;

  @Column({ length: 255 })
  url: string;

  @Column({ length: 60, default: 'image/webp' })
  mimeType: string;

  @Column({ type: 'int', default: 0 })
  size: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ length: 300, default: '' })
  alt: string;

  @CreateDateColumn()
  createdAt: Date;
}
