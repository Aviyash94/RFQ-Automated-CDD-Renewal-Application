import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomerType, RiskRating } from '../../../common/enums';
import { CustomerSourceRecord } from './customer-source.repository';
import {
  CustomerSourceRepository,
  OracleHealthStatus,
  OracleSyncResult,
} from './customer-source.repository';

@Injectable()
export class OracleCustomerRepository implements CustomerSourceRepository {
  private readonly logger = new Logger(OracleCustomerRepository.name);
  private lastSyncAt: Date | null = null;

  constructor(private config: ConfigService) {}

  async healthCheck(): Promise<OracleHealthStatus> {
    const enabled = this.config.get<boolean>('oracle.enabled');
    if (!enabled) {
      return {
        enabled: false,
        connected: false,
        message: 'Oracle integration is disabled',
      };
    }

    const host = this.config.get<string>('oracle.host');
    const user = this.config.get<string>('oracle.user');
    if (!host || !user) {
      return {
        enabled: true,
        connected: false,
        message: 'Oracle credentials not configured',
      };
    }

    return {
      enabled: true,
      connected: true,
      message: 'Oracle connection stub is healthy',
      lastSyncAt: this.lastSyncAt?.toISOString(),
    };
  }

  async fetchCustomers(_since?: Date): Promise<CustomerSourceRecord[]> {
    this.logger.log('Fetching customers from Oracle (stub)');
    this.lastSyncAt = new Date();

    return [
      {
        externalRef: 'ORA-10001',
        name: 'Oracle Stub Customer A',
        email: 'oracle.stub.a@example.com',
        phone: '+230 5000 0001',
        customerType: CustomerType.CORPORATE,
        riskRating: RiskRating.MEDIUM,
        cddExpiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        address: 'Port Louis, Mauritius',
      },
      {
        externalRef: 'ORA-10002',
        name: 'Oracle Stub Customer B',
        email: 'oracle.stub.b@example.com',
        phone: '+230 5000 0002',
        customerType: CustomerType.INDIVIDUAL,
        riskRating: RiskRating.LOW,
        cddExpiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        address: 'Curepipe, Mauritius',
      },
    ];
  }

  async sync(): Promise<OracleSyncResult> {
    const customers = await this.fetchCustomers();
    return {
      synced: customers.length,
      created: customers.length,
      updated: 0,
      errors: [],
    };
  }
}
