import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CustomerType, RiskRating } from '../../common/enums';
import { CddRequest } from './cdd-request.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  externalRef: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: CustomerType, default: CustomerType.INDIVIDUAL })
  customerType: CustomerType;

  @Column({ type: 'enum', enum: RiskRating, default: RiskRating.MEDIUM })
  riskRating: RiskRating;

  @Column({ type: 'date', nullable: true })
  cddExpiryDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  address: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt: Date | null;

  @OneToMany(() => CddRequest, (r) => r.customer)
  cddRequests: CddRequest[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
