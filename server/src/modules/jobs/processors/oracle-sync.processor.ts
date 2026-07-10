import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Customer } from '../../../database/entities/customer.entity';
import { JobRun } from '../../../database/entities/job-run.entity';
import { JobRunStatus } from '../../../common/enums';
import { OracleCustomerRepository } from '../../integrations/oracle/oracle-customer.repository';

@Processor('oracle-sync')
export class OracleSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(OracleSyncProcessor.name);

  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
    private oracleRepo: OracleCustomerRepository,
  ) {
    super();
  }

  async process(_job: Job) {
    const jobRun = await this.jobRunRepo.save({
      jobName: 'oracle-sync',
      status: JobRunStatus.RUNNING,
      startedAt: new Date(),
    });

    try {
      const records = await this.oracleRepo.fetchCustomers();
      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const record of records) {
        try {
          const existing = await this.customerRepo.findOne({
            where: { externalRef: record.externalRef },
          });

          if (existing) {
            Object.assign(existing, {
              name: record.name,
              email: record.email,
              phone: record.phone,
              customerType: record.customerType,
              riskRating: record.riskRating,
              cddExpiryDate: record.cddExpiryDate,
              address: record.address,
              lastSyncedAt: new Date(),
            });
            await this.customerRepo.save(existing);
            updated++;
          } else {
            await this.customerRepo.save({
              ...record,
              lastSyncedAt: new Date(),
            });
            created++;
          }
        } catch (error) {
          errors.push(
            `${record.externalRef}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.COMPLETED,
        completedAt: new Date(),
        metadata: { synced: records.length, created, updated, errors },
      });

      this.logger.log(`Oracle sync: ${created} created, ${updated} updated`);
      return { synced: records.length, created, updated, errors };
    } catch (error) {
      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });
      throw error;
    }
  }
}
