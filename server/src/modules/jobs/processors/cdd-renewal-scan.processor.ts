import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Customer } from '../../../database/entities/customer.entity';
import { CddRequest } from '../../../database/entities/cdd-request.entity';
import { ReminderRule } from '../../../database/entities/reminder-rule.entity';
import { JobRun } from '../../../database/entities/job-run.entity';
import { CddRequestStatus, CddPriority, JobRunStatus } from '../../../common/enums';
import { PortalService } from '../../portal/portal.service';

@Processor('cdd-renewal-scan')
export class CddRenewalScanProcessor extends WorkerHost {
  private readonly logger = new Logger(CddRenewalScanProcessor.name);

  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    @InjectRepository(ReminderRule) private ruleRepo: Repository<ReminderRule>,
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
    @InjectQueue('reminder-email') private reminderQueue: Queue,
    private portalService: PortalService,
  ) {
    super();
  }

  async process(_job: Job) {
    const jobRun = await this.jobRunRepo.save({
      jobName: 'cdd-renewal-scan',
      status: JobRunStatus.RUNNING,
      startedAt: new Date(),
    });

    try {
      const now = new Date();
      const rules = await this.ruleRepo.find({ where: { isActive: true } });
      let requestsCreated = 0;
      let remindersQueued = 0;

      for (const rule of rules) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + rule.daysBeforeDue);

        const expiringCustomers = await this.customerRepo.find({
          where: {
            cddExpiryDate: LessThanOrEqual(targetDate),
          },
        });

        for (const customer of expiringCustomers) {
          const existingRequest = await this.cddRepo.findOne({
            where: {
              customerId: customer.id,
              status: CddRequestStatus.SENT,
            },
          });

          if (!existingRequest) {
            const dueDate = customer.cddExpiryDate || targetDate;
            const request = await this.cddRepo.save({
              customerId: customer.id,
              referenceNumber: `CDD-${now.getFullYear()}-${Math.floor(Math.random() * 900000) + 100000}`,
              status: CddRequestStatus.SENT,
              priority: CddPriority.NORMAL,
              dueDate,
            });
            requestsCreated++;

            const { portalUrl } = await this.portalService.createToken(request.id);

            await this.reminderQueue.add('send-reminder', {
              cddRequestId: request.id,
              customerEmail: customer.email,
              referenceNumber: request.referenceNumber,
              dueDate: request.dueDate,
              portalUrl,
            });
            remindersQueued++;
          }
        }
      }

      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.COMPLETED,
        completedAt: new Date(),
        metadata: { requestsCreated, remindersQueued },
      });

      this.logger.log(`CDD renewal scan: ${requestsCreated} requests, ${remindersQueued} reminders`);
      return { requestsCreated, remindersQueued };
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
