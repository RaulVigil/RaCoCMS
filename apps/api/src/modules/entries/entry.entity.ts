import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Collection } from '../collections/collection.entity';
import type { EntryStatus, IPageBlock, ISeoMetadata } from '@raco/shared';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  collectionId: string;

  @ManyToOne(() => Collection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @Column({ default: '' })
  title: string;

  @Column()
  slug: string;

  @Column({ type: 'enum', enum: ['draft', 'published', 'archived'], default: 'draft' })
  status: EntryStatus;

  @Column({ default: 'es' })
  locale: string;

  @Column({ type: 'json' })
  data: Record<string, unknown>;

  @Column({ type: 'json' })
  seoData: ISeoMetadata;

  // Términos asignados por taxonomía: { [taxonomyId]: termId[] }
  @Column({ type: 'json', nullable: true })
  terms: Record<string, string[]> | null;

  // Diseño del constructor visual (árbol de bloques JSON, nunca HTML)
  @Column({ type: 'json', nullable: true })
  blocks: IPageBlock[] | null;

  // Programación: el SchedulerService publica/despublica cuando llega la hora
  @Column({ type: 'datetime', nullable: true })
  publishAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  unpublishAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
