import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { ITaxonomyTerm } from '@raco/shared';

@Entity('taxonomies')
export class Taxonomy {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', length: 100 })
  collectionId: string;

  @Column({ default: false })
  hierarchical: boolean;

  @Column({ type: 'json' })
  terms: ITaxonomyTerm[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
