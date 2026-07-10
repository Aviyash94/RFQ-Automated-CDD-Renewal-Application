import {
  Injectable,
  NotFoundException,
  BadRequestException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PortalToken } from '../../database/entities/portal-token.entity';
import {
  PortalRiskSubmission,
  RiskDataFieldChange,
} from '../../database/entities/portal-risk-submission.entity';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { DocumentsService } from '../documents/documents.service';
import { DocumentValidationService } from '../document-validation/document-validation.service';
import {
  CustomerType,
  CddRequestStatus,
  DocumentType,
} from '../../common/enums';
import { SubmitRiskDataDto } from './dto/portal.dto';

const INDIVIDUAL_DOCS: Array<{ type: DocumentType; label: string; required: boolean }> = [
  { type: DocumentType.PROOF_OF_ADDRESS, label: 'Proof of Address (less than 3 months)', required: true },
  { type: DocumentType.NATIONAL_ID, label: 'National Identity Card (NID)', required: true },
  {
    type: DocumentType.RELATIONSHIP_DOCUMENT,
    label: 'Relationship Document (if Proof of Address under another name)',
    required: false,
  },
];

const CORPORATE_DOCS: Array<{ type: DocumentType; label: string; required: boolean }> = [
  { type: DocumentType.FINANCIAL_STATEMENTS, label: 'Latest Financial Statements', required: true },
  {
    type: DocumentType.REGISTER_DIRECTORS_SHAREHOLDERS,
    label: 'Register of Directors & Shareholders',
    required: true,
  },
  { type: DocumentType.UBO_DECLARATION, label: 'Declaration of Ultimate Beneficial Owner', required: true },
  {
    type: DocumentType.DIRECTOR_KYC,
    label: 'Updated KYC/CDD of Directors (NID/Passport & Proof of Address)',
    required: true,
  },
];

const INDIVIDUAL_RISK_FIELDS = [
  { field: 'name', label: 'Name' },
  { field: 'residentialAddress', label: 'Residential Address' },
  { field: 'occupation', label: 'Occupation / Profession' },
  { field: 'businessStatus', label: 'Business / Self-Employed Status' },
  { field: 'sourceOfIncome', label: 'Source of Income' },
  { field: 'contactNumber', label: 'Contact Number' },
  { field: 'emailAddress', label: 'Email Address' },
];

@Injectable()
export class PortalService {
  constructor(
    @InjectRepository(PortalToken) private tokenRepo: Repository<PortalToken>,
    @InjectRepository(PortalRiskSubmission)
    private riskRepo: Repository<PortalRiskSubmission>,
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    private documentsService: DocumentsService,
    private documentValidationService: DocumentValidationService,
    private config: ConfigService,
  ) {}

  private hashToken(raw: string) {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  async createToken(cddRequestId: string): Promise<{ rawToken: string; portalUrl: string; expiresAt: Date }> {
    const request = await this.cddRepo.findOne({ where: { id: cddRequestId } });
    if (!request) throw new NotFoundException('CDD request not found');

    // Revoke prior active tokens for this request
    await this.tokenRepo.update(
      { cddRequestId, isRevoked: false },
      { isRevoked: true },
    );

    const rawToken = crypto.randomBytes(32).toString('hex');
    const ttlDays = this.config.get<number>('portal.tokenTtlDays') || 60;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await this.tokenRepo.save({
      cddRequestId,
      tokenHash: this.hashToken(rawToken),
      expiresAt,
      isRevoked: false,
    });

    const clientUrl = this.config.get<string>('clientUrl') || 'http://localhost:3000';
    return {
      rawToken,
      portalUrl: `${clientUrl}/portal/${rawToken}`,
      expiresAt,
    };
  }

  async getActiveTokenForRequest(cddRequestId: string) {
    return this.tokenRepo.findOne({
      where: {
        cddRequestId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  private async resolveToken(rawToken: string) {
    const token = await this.tokenRepo.findOne({
      where: { tokenHash: this.hashToken(rawToken) },
      relations: {
        cddRequest: {
          customer: true,
          documents: { document: true },
        },
      },
    });

    if (!token) throw new NotFoundException('Invalid portal link');
    if (token.isRevoked) throw new GoneException('This portal link has been revoked');
    if (token.expiresAt < new Date()) throw new GoneException('This portal link has expired');

    token.lastAccessedAt = new Date();
    await this.tokenRepo.save(token);
    return token;
  }

  async getPortalSession(rawToken: string) {
    const token = await this.resolveToken(rawToken);
    const request = token.cddRequest;
    const customer = request.customer;
    const customerType = customer.customerType;
    const requiredDocs =
      customerType === CustomerType.CORPORATE ? CORPORATE_DOCS : INDIVIDUAL_DOCS;

    const uploaded = (request.documents || []).map((link) => ({
      id: link.document.id,
      fileName: link.document.fileName,
      documentType: link.document.documentType,
      validationStatus: link.document.validationStatus,
      createdAt: link.document.createdAt,
    }));

    const riskSubmission = await this.riskRepo.findOne({
      where: { cddRequestId: request.id },
      order: { createdAt: 'DESC' },
    });

    return {
      referenceNumber: request.referenceNumber,
      dueDate: request.dueDate,
      status: request.status,
      submitted: !!token.submittedAt,
      submittedAt: token.submittedAt,
      expiresAt: token.expiresAt,
      customer: {
        firstName: customer.name.split(' ')[0],
        customerType,
      },
      requiredDocuments: requiredDocs,
      uploadedDocuments: uploaded,
      riskFields: INDIVIDUAL_RISK_FIELDS,
      riskSubmission: riskSubmission
        ? {
            fields: riskSubmission.fields,
            hasAnyChange: riskSubmission.hasAnyChange,
            additionalNotes: riskSubmission.additionalNotes,
            createdAt: riskSubmission.createdAt,
          }
        : null,
    };
  }

  async uploadDocument(
    rawToken: string,
    file: Express.Multer.File,
    documentType: DocumentType,
  ) {
    const token = await this.resolveToken(rawToken);
    if (token.submittedAt) {
      throw new BadRequestException('This request has already been submitted');
    }

    const allowed =
      token.cddRequest.customer.customerType === CustomerType.CORPORATE
        ? CORPORATE_DOCS
        : INDIVIDUAL_DOCS;
    if (!allowed.some((d) => d.type === documentType) && documentType !== DocumentType.OTHER) {
      throw new BadRequestException('Document type not allowed for this customer');
    }

    const document = await this.documentsService.upload(
      file,
      documentType,
      token.cddRequestId,
    );

    // Queue AI validation automatically after customer upload
    await this.documentValidationService.validate({ documentId: document.id });

    // Move to awaiting docs if still sent
    if (token.cddRequest.status === CddRequestStatus.SENT) {
      await this.cddRepo.update(token.cddRequestId, {
        status: CddRequestStatus.AWAITING_DOCS,
      });
    }

    return {
      id: document.id,
      fileName: document.fileName,
      documentType: document.documentType,
      validationStatus: document.validationStatus,
    };
  }

  async submitRiskData(rawToken: string, dto: SubmitRiskDataDto) {
    const token = await this.resolveToken(rawToken);
    if (token.submittedAt) {
      throw new BadRequestException('This request has already been submitted');
    }

    const fields: RiskDataFieldChange[] = dto.fields.map((f) => ({
      field: f.field,
      label: f.label,
      noChange: f.noChange,
      change: f.change,
      updatedValue: f.updatedValue,
    }));

    const hasAnyChange = fields.some((f) => f.change);

    const submission = await this.riskRepo.save({
      cddRequestId: token.cddRequestId,
      customerType: token.cddRequest.customer.customerType,
      fields,
      hasAnyChange,
      additionalNotes: dto.additionalNotes || null,
    });

    return {
      id: submission.id,
      hasAnyChange: submission.hasAnyChange,
      createdAt: submission.createdAt,
    };
  }

  async finalizeSubmission(rawToken: string) {
    const token = await this.resolveToken(rawToken);
    if (token.submittedAt) {
      return { message: 'Already submitted', submittedAt: token.submittedAt };
    }

    const docs = token.cddRequest.documents || [];
    const required =
      token.cddRequest.customer.customerType === CustomerType.CORPORATE
        ? CORPORATE_DOCS.filter((d) => d.required)
        : INDIVIDUAL_DOCS.filter((d) => d.required);

    const uploadedTypes = new Set(docs.map((d) => d.document.documentType));
    const missing = required.filter((d) => !uploadedTypes.has(d.type));
    if (missing.length > 0) {
      throw new BadRequestException({
        message: 'Required documents are missing',
        missing: missing.map((m) => m.label),
      });
    }

    token.submittedAt = new Date();
    await this.tokenRepo.save(token);

    await this.cddRepo.update(token.cddRequestId, {
      status: CddRequestStatus.UNDER_REVIEW,
    });

    return {
      message: 'CDD renewal documents submitted successfully',
      submittedAt: token.submittedAt,
      status: CddRequestStatus.UNDER_REVIEW,
    };
  }

  async listTokensForRequest(cddRequestId: string) {
    return this.tokenRepo.find({
      where: { cddRequestId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRiskSubmissionForRequest(cddRequestId: string) {
    return this.riskRepo.findOne({
      where: { cddRequestId },
      order: { createdAt: 'DESC' },
    });
  }
}
