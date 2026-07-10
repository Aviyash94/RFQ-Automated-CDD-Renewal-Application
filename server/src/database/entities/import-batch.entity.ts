import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ImportBatchStatus } from '../../common/enums';

@Entity('import_batches')
export class ImportBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column({ type: 'enum', enum: ImportBatchStatus, default: ImportBatchStatus.PENDING })
  status: ImportBatchStatus;

  @Column({ default: 0 })
  totalRows: number;

  @Column({ default: 0 })
  successRows: number;

  @Column({ default: 0 })
  failedRows: number;

  @Column({ type: 'jsonb', nullable: true })
  errors: Array<{ row: number; message: string }>;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
