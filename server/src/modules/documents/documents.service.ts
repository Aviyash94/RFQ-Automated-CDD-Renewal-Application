import {
  Injectable,
  NotFoundException,
  BadRequestException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync } from 'fs';
import {
  normalizeStoragePath,
  resolveStoragePath,
} from '../../common/utils/upload-path.util';
import { Document } from '../../database/entities/document.entity';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { CddRequestDocument } from '../../database/entities/cdd-request-document.entity';
import { ValidationStatus } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import { DocumentQueryDto, LinkDocumentDto } from './dto/document.dto';
import { DocumentType } from '../../common/enums';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private documentRepo: Repository<Document>,
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    @InjectRepository(CddRequestDocument)
    private linkRepo: Repository<CddRequestDocument>,
    private config: ConfigService,
  ) {}

  async findAll(query: DocumentQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.documentRepo.createQueryBuilder('document');

    if (query.documentType) {
      qb.andWhere('document.documentType = :documentType', {
        documentType: query.documentType,
      });
    }
    if (query.cddRequestId) {
      qb.innerJoin('document.cddRequestDocuments', 'link');
      qb.andWhere('link.cddRequestId = :cddRequestId', {
        cddRequestId: query.cddRequestId,
      });
    }
    if (query.search) {
      qb.andWhere('document.fileName ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('document.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const document = await this.documentRepo.findOne({
      where: { id },
      relations: {
        cddRequestDocuments: { cddRequest: true },
        validationResults: true,
      },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }

  async upload(
    file: Express.Multer.File,
    documentType: DocumentType,
    cddRequestId?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const document = await this.documentRepo.save({
      fileName: file.originalname,
      mimeType: file.mimetype,
      storagePath: normalizeStoragePath(file.path),
      fileSize: file.size,
      documentType,
      validationStatus: ValidationStatus.PENDING,
    });

    if (cddRequestId) {
      await this.linkToCddRequest({ cddRequestId, documentId: document.id });
    }

    return document;
  }

  async download(id: string): Promise<StreamableFile> {
    const document = await this.findOne(id);
    return this.streamFile(document, 'attachment');
  }

  async preview(id: string): Promise<StreamableFile> {
    const document = await this.findOne(id);
    return this.streamFile(document, 'inline');
  }

  private streamFile(document: Document, disposition: 'inline' | 'attachment'): StreamableFile {
    const filePath = resolveStoragePath(
      document.storagePath,
      this.config.get<string>('uploadDir') || './uploads',
    );

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found on disk');
    }

    const safeName = document.fileName.replace(/[^\w\s.-]/g, '_');
    const stream = createReadStream(filePath);
    return new StreamableFile(stream, {
      type: document.mimeType,
      disposition: `${disposition}; filename="${safeName}"`,
    });
  }

  async linkToCddRequest(dto: LinkDocumentDto) {
    const cddRequest = await this.cddRepo.findOne({ where: { id: dto.cddRequestId } });
    if (!cddRequest) throw new NotFoundException('CDD request not found');

    const document = await this.documentRepo.findOne({ where: { id: dto.documentId } });
    if (!document) throw new NotFoundException('Document not found');

    const existing = await this.linkRepo.findOne({
      where: { cddRequestId: dto.cddRequestId, documentId: dto.documentId },
    });
    if (existing) {
      return { message: 'Document already linked to CDD request' };
    }

    await this.linkRepo.save({
      cddRequestId: dto.cddRequestId,
      documentId: dto.documentId,
    });

    return { message: 'Document linked to CDD request successfully' };
  }

  async remove(id: string) {
    const document = await this.findOne(id);
    await this.documentRepo.remove(document);
    return { message: 'Document deleted successfully' };
  }
}
