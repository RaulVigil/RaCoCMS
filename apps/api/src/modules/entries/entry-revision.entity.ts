import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import type { IEntrySnapshot } from '@raco/shared';
import { Entry } from './entry.entity';

// Una versión guardada de una entrada: se crea en cada guardado que cambia algo
@Entity('entry_revisions')
@Index(['entryId', 'createdAt'])
export class EntryRevision {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entryId: number;

  // Si se borra la entrada, se va con su historial
  @ManyToOne(() => Entry, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'entryId' })
  entry: Entry;

  @Column({ type: 'json' })
  snapshot: IEntrySnapshot;

  @Column({ length: 120 })
  note: string;

  @Column({ type: 'int', nullable: true })
  authorId: number | null;

  @Column({ type: 'varchar', length: 190, nullable: true })
  authorEmail: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
