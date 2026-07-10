import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CddRequest } from './cdd-request.entity';
import { Document } from './document.entity';

@Entity('cdd_request_documents')
export class CddRequestDocument {
  @PrimaryColumn('uuid')
  cddRequestId: string;

  @PrimaryColumn('uuid')
  documentId: string;

  @ManyToOne(() => CddRequest, (r) => r.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cddRequestId' })
  cddRequest: CddRequest;

  @ManyToOne(() => Document, (d) => d.cddRequestDocuments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: Document;
}
