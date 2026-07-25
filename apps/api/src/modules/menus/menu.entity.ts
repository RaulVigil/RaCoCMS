import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { IMenuItem } from '@raco/shared';

@Entity('menus')
export class Menu {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id: string;

  @Column()
  name: string;

  @Column({ type: 'json' })
  items: IMenuItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
