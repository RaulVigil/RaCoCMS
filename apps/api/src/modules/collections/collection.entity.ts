import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('collections')
export class Collection {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  schema: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
