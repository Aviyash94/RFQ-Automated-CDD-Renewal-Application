import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { CddRequestStatus, CddPriority } from '../../common/enums';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { CddRequestDocument } from './cdd-request-document.entity';
import { EmailLog } from './email-log.entity';

@Entity('cdd_requests')
export class CddRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  customerId: string;

  @ManyToOne(() => Customer, (c) => c.cddRequests)
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ unique: true })
  referenceNumber: string;

  @Column({ type: 'enum', enum: CddRequestStatus, default: CddRequestStatus.DRAFT })
  status: CddRequestStatus;

  @Column({ type: 'enum', enum: CddPriority, default: CddPriority.NORMAL })
  priority: CddPriority;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => CddRequestDocument, (d) => d.cddRequest)
  documents: CddRequestDocument[];

  @OneToMany(() => EmailLog, (e) => e.cddRequest)
  emailLogs: EmailLog[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
