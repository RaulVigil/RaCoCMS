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

  // Colecciones del sistema (ej. "pages"): siempre existen y no se pueden borrar
  @Column({ default: false })
  isNative: boolean;

  // Sus entradas se diseñan con el constructor visual (como activar Divi en un post type)
  @Column({ default: false })
  useBuilder: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
