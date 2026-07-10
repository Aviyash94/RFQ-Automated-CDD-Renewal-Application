import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { JobRun } from '../../database/entities/job-run.entity';
import { ImportBatch } from '../../database/entities/import-batch.entity';
import { Customer } from '../../database/entities/customer.entity';
import { Document } from '../../database/entities/document.entity';
import { ValidationResult } from '../../database/entities/validation-result.entity';
import { EmailLog } from '../../database/entities/email-log.entity';
import { EmailTemplate } from '../../database/entities/email-template.entity';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { ReminderRule } from '../../database/entities/reminder-rule.entity';
import { DocumentValidationModule } from '../document-validation/document-validation.module';
import { OracleModule } from '../integrations/oracle/oracle.module';
import { PortalModule } from '../portal/portal.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { CustomerImportProcessor } from './processors/customer-import.processor';
import { DocumentAiValidateProcessor } from './processors/document-ai-validate.processor';
import { ReminderEmailProcessor } from './processors/reminder-email.processor';
import { CddRenewalScanProcessor } from './processors/cdd-renewal-scan.processor';
import { OracleSyncProcessor } from './processors/oracle-sync.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobRun,
      ImportBatch,
      Customer,
      Document,
      ValidationResult,
      EmailLog,
      EmailTemplate,
      CddRequest,
      ReminderRule,
    ]),
    BullModule.registerQueue(
      { name: 'customer-import' },
      { name: 'document-ai-validate' },
      { name: 'reminder-email' },
      { name: 'cdd-renewal-scan' },
      { name: 'oracle-sync' },
    ),
    DocumentValidationModule,
    OracleModule,
    PortalModule,
  ],
  controllers: [JobsController],
  providers: [
    JobsService,
    CustomerImportProcessor,
    DocumentAiValidateProcessor,
    ReminderEmailProcessor,
    CddRenewalScanProcessor,
    OracleSyncProcessor,
  ],
  exports: [JobsService],
})
export class JobsModule {}
