import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import type { IPageBlock, TemplateType } from '@raco/shared';

// Una plantilla por colección y tipo: "single" (cada entrada) o "archive" (el listado)
@Entity('templates')
@Index(['collectionId', 'type'], { unique: true })
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 100 })
  collectionId: string;

  @Column({ type: 'enum', enum: ['single', 'archive'], default: 'single' })
  type: TemplateType;

  @Column({ type: 'json' })
  blocks: IPageBlock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
