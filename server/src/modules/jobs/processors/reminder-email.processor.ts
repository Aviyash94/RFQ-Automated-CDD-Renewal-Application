import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { EmailLog } from '../../../database/entities/email-log.entity';
import { EmailTemplate } from '../../../database/entities/email-template.entity';
import { JobRun } from '../../../database/entities/job-run.entity';
import { EmailStatus, JobRunStatus } from '../../../common/enums';
import { MailService } from '../../../mail/mail.service';
import { PortalService } from '../../portal/portal.service';

interface ReminderJobData {
  cddRequestId: string;
  customerEmail: string;
  referenceNumber: string;
  dueDate: Date;
  portalUrl?: string;
}

@Processor('reminder-email')
export class ReminderEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(ReminderEmailProcessor.name);

  constructor(
    @InjectRepository(EmailLog) private emailLogRepo: Repository<EmailLog>,
    @InjectRepository(EmailTemplate) private templateRepo: Repository<EmailTemplate>,
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
    private mailService: MailService,
    private portalService: PortalService,
  ) {
    super();
  }

  async process(job: Job<ReminderJobData>) {
    const jobRun = await this.jobRunRepo.save({
      jobName: 'reminder-email',
      status: JobRunStatus.RUNNING,
      metadata: { cddRequestId: job.data.cddRequestId },
      startedAt: new Date(),
    });

    try {
      const template = await this.templateRepo.findOne({
        where: { key: 'cdd-reminder', isActive: true },
      });

      let portalUrl = job.data.portalUrl;
      if (!portalUrl) {
        const token = await this.portalService.createToken(job.data.cddRequestId);
        portalUrl = token.portalUrl;
      }

      const variables = {
        referenceNumber: job.data.referenceNumber,
        dueDate: new Date(job.data.dueDate).toLocaleDateString(),
        customerName: job.data.customerEmail,
        portalUrl,
      };

      const subject = template
        ? this.mailService.renderTemplate(template.subject, variables)
        : `CDD Renewal Reminder - ${job.data.referenceNumber}`;
      const fallbackBody = `
        <p>Your CDD renewal request <strong>${job.data.referenceNumber}</strong> is due on ${variables.dueDate}.</p>
        <p><a href="${portalUrl}">Click here to upload your documents securely</a></p>
      `;
      const body = template
        ? this.mailService.renderTemplate(template.body, variables)
        : fallbackBody;

      const log = await this.emailLogRepo.save({
        cddRequestId: job.data.cddRequestId,
        templateKey: template?.key || 'cdd-reminder',
        recipient: job.data.customerEmail,
        subject,
        body,
        status: EmailStatus.PENDING,
      });

      await this.mailService.sendMail({
        to: job.data.customerEmail,
        subject,
        html: body,
      });

      await this.emailLogRepo.update(log.id, {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      });

      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.COMPLETED,
        completedAt: new Date(),
      });

      this.logger.log(`Reminder sent for ${job.data.referenceNumber}`);
      return { sent: true };
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
