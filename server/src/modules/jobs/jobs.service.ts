import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobRun } from '../../database/entities/job-run.entity';
import { paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
    @InjectQueue('customer-import') private importQueue: Queue,
    @InjectQueue('document-ai-validate') private validateQueue: Queue,
    @InjectQueue('reminder-email') private reminderQueue: Queue,
    @InjectQueue('cdd-renewal-scan') private scanQueue: Queue,
    @InjectQueue('oracle-sync') private oracleQueue: Queue,
  ) {}

  async findAll(page = 1, limit = 20, jobName?: string) {
    const skip = (page - 1) * limit;
    const qb = this.jobRunRepo.createQueryBuilder('job');
    if (jobName) {
      qb.andWhere('job.jobName = :jobName', { jobName });
    }
    qb.orderBy('job.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async triggerCddRenewalScan() {
    const job = await this.scanQueue.add('scan', {});
    return { message: 'CDD renewal scan queued', jobId: job.id };
  }

  async triggerOracleSync() {
    const job = await this.oracleQueue.add('sync-customers', {});
    return { message: 'Oracle sync queued', jobId: job.id };
  }

  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async scheduledRenewalScan() {
    await this.scanQueue.add('scheduled-scan', {});
  }
}
