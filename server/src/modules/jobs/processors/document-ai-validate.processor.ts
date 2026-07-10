import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { Document } from '../../../database/entities/document.entity';
import { ValidationResult } from '../../../database/entities/validation-result.entity';
import { JobRun } from '../../../database/entities/job-run.entity';
import { JobRunStatus, ValidationStatus, ValidationVerdict } from '../../../common/enums';
import {
  VALIDATION_PROVIDER,
  ValidationProvider,
} from '../../document-validation/providers/validation-provider.interface';

interface ValidateJobData {
  documentId: string;
  filePath: string;
  documentType: string;
}

@Processor('document-ai-validate')
export class DocumentAiValidateProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentAiValidateProcessor.name);

  constructor(
    @InjectRepository(Document) private documentRepo: Repository<Document>,
    @InjectRepository(ValidationResult) private validationRepo: Repository<ValidationResult>,
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
    @Inject(VALIDATION_PROVIDER) private provider: ValidationProvider,
  ) {
    super();
  }

  async process(job: Job<ValidateJobData>) {
    const jobRun = await this.jobRunRepo.save({
      jobName: 'document-ai-validate',
      status: JobRunStatus.RUNNING,
      metadata: { documentId: job.data.documentId },
      startedAt: new Date(),
    });

    try {
      const document = await this.documentRepo.findOne({
        where: { id: job.data.documentId },
      });
      if (!document) throw new Error('Document not found');

      const result = await this.provider.validate(job.data.filePath, job.data.documentType);

      await this.validationRepo.save({
        documentId: document.id,
        verdict: result.verdict,
        confidenceScore: result.confidenceScore,
        checks: result.checks,
        extractedFields: result.extractedFields,
      });

      document.validationStatus =
        result.verdict === ValidationVerdict.PASS
          ? ValidationStatus.PASSED
          : ValidationStatus.FAILED;
      document.extractedData = result.extractedFields;
      await this.documentRepo.save(document);

      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.COMPLETED,
        completedAt: new Date(),
      });

      this.logger.log(`Validated document ${document.id}: ${result.verdict}`);
      return result;
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
