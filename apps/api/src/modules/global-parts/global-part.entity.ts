import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { IPageBlock } from '@raco/shared';

@Entity('global_parts')
export class GlobalPart {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  blocks: IPageBlock[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
