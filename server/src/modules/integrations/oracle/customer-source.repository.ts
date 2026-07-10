import { CustomerType, RiskRating } from '../../../common/enums';

export interface CustomerSourceRecord {
  externalRef: string;
  name: string;
  email: string;
  phone?: string;
  customerType: CustomerType;
  riskRating: RiskRating;
  cddExpiryDate?: Date;
  address?: string;
}

export interface OracleHealthStatus {
  enabled: boolean;
  connected: boolean;
  message: string;
  lastSyncAt?: string;
}

export interface OracleSyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export const CUSTOMER_SOURCE_REPOSITORY = 'CUSTOMER_SOURCE_REPOSITORY';

export interface CustomerSourceRepository {
  healthCheck(): Promise<OracleHealthStatus>;
  fetchCustomers(since?: Date): Promise<CustomerSourceRecord[]>;
}
