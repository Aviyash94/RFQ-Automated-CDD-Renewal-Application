import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { readFileSync, existsSync } from 'fs';
import * as XLSX from 'xlsx';
import { ImportBatch } from '../../../database/entities/import-batch.entity';
import { Customer } from '../../../database/entities/customer.entity';
import { JobRun } from '../../../database/entities/job-run.entity';
import { ImportBatchStatus, JobRunStatus, CustomerType, RiskRating } from '../../../common/enums';

interface ImportJobData {
  batchId: string;
  filePath: string;
  fileName: string;
}

@Processor('customer-import')
export class CustomerImportProcessor extends WorkerHost {
  private readonly logger = new Logger(CustomerImportProcessor.name);

  constructor(
    @InjectRepository(ImportBatch) private batchRepo: Repository<ImportBatch>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
  ) {
    super();
  }

  async process(job: Job<ImportJobData>) {
    const jobRun = await this.jobRunRepo.save({
      jobName: 'customer-import',
      status: JobRunStatus.RUNNING,
      metadata: { batchId: job.data.batchId },
      startedAt: new Date(),
    });

    try {
      const batch = await this.batchRepo.findOne({ where: { id: job.data.batchId } });
      if (!batch) throw new Error('Import batch not found');

      batch.status = ImportBatchStatus.PROCESSING;
      await this.batchRepo.save(batch);

      const rows = this.parseFile(job.data.filePath);
      const errors: Array<{ row: number; message: string }> = [];
      let successRows = 0;

      for (let i = 0; i < rows.length; i++) {
        try {
          const row = rows[i];
          await this.customerRepo.save({
            name: row.name || `Imported Customer ${i + 1}`,
            email: row.email || `import${i + 1}@example.com`,
            phone: row.phone,
            externalRef: row.externalRef,
            customerType: (row.customerType as CustomerType) || CustomerType.INDIVIDUAL,
            riskRating: (row.riskRating as RiskRating) || RiskRating.MEDIUM,
            address: row.address,
          });
          successRows++;
        } catch (error) {
          errors.push({
            row: i + 2,
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      batch.status = errors.length === rows.length ? ImportBatchStatus.FAILED : ImportBatchStatus.COMPLETED;
      batch.totalRows = rows.length;
      batch.successRows = successRows;
      batch.failedRows = rows.length - successRows;
      batch.errors = errors;
      await this.batchRepo.save(batch);

      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.COMPLETED,
        completedAt: new Date(),
        metadata: { batchId: job.data.batchId, successRows, failedRows: batch.failedRows },
      });

      this.logger.log(`Import batch ${batch.id} completed: ${successRows}/${rows.length} rows`);
      return { successRows, totalRows: rows.length };
    } catch (error) {
      await this.jobRunRepo.update(jobRun.id, {
        status: JobRunStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
      });
      throw error;
    }
  }

  private parseFile(filePath: string): Record<string, string>[] {
    if (!existsSync(filePath)) return [];

    const buffer = readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
  }
}
