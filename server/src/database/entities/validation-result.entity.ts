import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ValidationVerdict } from '../../common/enums';
import { Document } from './document.entity';
import { User } from './user.entity';

@Entity('validation_results')
export class ValidationResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  documentId: string;

  @ManyToOne(() => Document, (d) => d.validationResults)
  @JoinColumn({ name: 'documentId' })
  document: Document;

  @Column({ type: 'enum', enum: ValidationVerdict })
  verdict: ValidationVerdict;

  @Column({ type: 'float' })
  confidenceScore: number;

  @Column({ type: 'jsonb' })
  checks: Array<{ name: string; passed: boolean; message: string }>;

  @Column({ type: 'jsonb', nullable: true })
  extractedFields: Record<string, string>;

  @Column({ type: 'uuid', nullable: true })
  reviewedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedById' })
  reviewedBy: User | null;

  @Column({ type: 'text', nullable: true })
  overrideReason: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
