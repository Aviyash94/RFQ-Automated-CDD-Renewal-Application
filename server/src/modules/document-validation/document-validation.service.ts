import {
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Document } from '../../database/entities/document.entity';
import { ValidationResult } from '../../database/entities/validation-result.entity';
import { ValidationStatus, ValidationVerdict } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import {
  VALIDATION_PROVIDER,
  ValidationProvider,
} from './providers/validation-provider.interface';
import {
  ValidateDocumentDto,
  OverrideValidationDto,
  ValidationQueryDto,
} from './dto/validation.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { resolveStoragePath } from '../../common/utils/upload-path.util';

@Injectable()
export class DocumentValidationService {
  constructor(
    @InjectRepository(Document) private documentRepo: Repository<Document>,
    @InjectRepository(ValidationResult)
    private validationRepo: Repository<ValidationResult>,
    @Inject(VALIDATION_PROVIDER) private provider: ValidationProvider,
    @InjectQueue('document-ai-validate') private validateQueue: Queue,
    private config: ConfigService,
  ) {}

  async findAll(query: ValidationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.validationRepo
      .createQueryBuilder('result')
      .leftJoinAndSelect('result.document', 'document')
      .leftJoinAndSelect('result.reviewedBy', 'reviewedBy');

    if (query.documentId) {
      qb.andWhere('result.documentId = :documentId', { documentId: query.documentId });
    }
    if (query.verdict) {
      qb.andWhere('result.verdict = :verdict', { verdict: query.verdict });
    }
    if (query.status) {
      qb.andWhere('document.validationStatus = :status', { status: query.status });
    }

    qb.orderBy('result.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const result = await this.validationRepo.findOne({
      where: { id },
      relations: { document: true, reviewedBy: true },
    });
    if (!result) throw new NotFoundException('Validation result not found');
    return result;
  }

  async validate(dto: ValidateDocumentDto) {
    const document = await this.documentRepo.findOne({ where: { id: dto.documentId } });
    if (!document) throw new NotFoundException('Document not found');

    document.validationStatus = ValidationStatus.PROCESSING;
    await this.documentRepo.save(document);

    const uploadDir = this.config.get<string>('uploadDir') || './uploads';
    const filePath = resolveStoragePath(document.storagePath, uploadDir);

    await this.validateQueue.add('validate-document', {
      documentId: document.id,
      filePath,
      documentType: document.documentType,
    });

    return {
      message: 'Validation queued for processing',
      documentId: document.id,
    };
  }

  async validateSync(documentId: string) {
    const document = await this.documentRepo.findOne({ where: { id: documentId } });
    if (!document) throw new NotFoundException('Document not found');

    document.validationStatus = ValidationStatus.PROCESSING;
    await this.documentRepo.save(document);

    const uploadDir = this.config.get<string>('uploadDir') || './uploads';
    const filePath = resolveStoragePath(document.storagePath, uploadDir);

    const providerResult = await this.provider.validate(
      filePath,
      document.documentType,
    );

    const result = await this.validationRepo.save({
      documentId: document.id,
      verdict: providerResult.verdict,
      confidenceScore: providerResult.confidenceScore,
      checks: providerResult.checks,
      extractedFields: providerResult.extractedFields,
    });

    document.validationStatus =
      providerResult.verdict === ValidationVerdict.PASS
        ? ValidationStatus.PASSED
        : ValidationStatus.FAILED;
    document.extractedData = providerResult.extractedFields;
    await this.documentRepo.save(document);

    return result;
  }

  async override(id: string, dto: OverrideValidationDto, user: AuthUser) {
    const result = await this.findOne(id);

    result.verdict = dto.verdict;
    result.overrideReason = dto.overrideReason;
    result.reviewedById = user.id;
    result.reviewedAt = new Date();

    const saved = await this.validationRepo.save(result);

    await this.documentRepo.update(result.documentId, {
      validationStatus: ValidationStatus.OVERRIDDEN,
    });

    return saved;
  }
}
