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
import type { EntryStatus, ISeoMetadata } from '@raco/shared';

@Entity('entries')
export class Entry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  collectionId: string;

  @ManyToOne(() => Collection, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
