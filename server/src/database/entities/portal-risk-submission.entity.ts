import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CddRequest } from './cdd-request.entity';
import { CustomerType } from '../../common/enums';

export interface RiskDataFieldChange {
  field: string;
  label: string;
  noChange: boolean;
  change: boolean;
  updatedValue?: string;
}

@Entity('portal_risk_submissions')
export class PortalRiskSubmission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  cddRequestId: string;

  @ManyToOne(() => CddRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cddRequestId' })
  cddRequest: CddRequest;

  @Column({ type: 'enum', enum: CustomerType })
  customerType: CustomerType;

  @Column({ type: 'jsonb' })
  fields: RiskDataFieldChange[];

  @Column({ type: 'boolean', default: false })
  hasAnyChange: boolean;

  @Column({ type: 'text', nullable: true })
  additionalNotes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
