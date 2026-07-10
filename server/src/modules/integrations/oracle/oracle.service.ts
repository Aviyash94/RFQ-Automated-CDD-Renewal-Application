import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OracleCustomerRepository } from './oracle-customer.repository';

@Injectable()
export class OracleService {
  constructor(
    private oracleRepo: OracleCustomerRepository,
    @InjectQueue('oracle-sync') private oracleQueue: Queue,
  ) {}

  healthCheck() {
    return this.oracleRepo.healthCheck();
  }

  async triggerSync() {
    const job = await this.oracleQueue.add('sync-customers', {});
    return {
      message: 'Oracle sync queued',
      jobId: job.id,
    };
  }
}
