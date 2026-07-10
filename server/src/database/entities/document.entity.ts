import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentType, ValidationStatus } from '../../common/enums';
import { CddRequestDocument } from './cdd-request-document.entity';
import { ValidationResult } from './validation-result.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  mimeType: string;

  @Column()
  storagePath: string;

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @Column({ type: 'enum', enum: ValidationStatus, default: ValidationStatus.PENDING })
  validationStatus: ValidationStatus;

  @Column({ type: 'jsonb', nullable: true })
  extractedData: Record<string, unknown>;

  @OneToMany(() => CddRequestDocument, (crd) => crd.document)
  cddRequestDocuments: CddRequestDocument[];

  @OneToMany(() => ValidationResult, (vr) => vr.document)
  validationResults: ValidationResult[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
