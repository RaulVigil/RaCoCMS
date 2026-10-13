import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

// Ajustes globales del sitio como pares clave → JSON (ej. "design": paleta y tipografías)
@Entity('settings')
export class Setting {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'json' })
  value: unknown;

  @UpdateDateColumn()
  updatedAt: Date;
}
