import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { Customer } from '../../database/entities/customer.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { EmailLog } from '../../database/entities/email-log.entity';
import { CddRequestStatus } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import { applySort } from '../../common/dto/sorting.dto';
import {
  CreateCddRequestDto,
  UpdateCddRequestDto,
  TransitionStatusDto,
  CddRequestQueryDto,
} from './dto/cdd-request.dto';
import { PortalService } from '../portal/portal.service';
import { MailService } from '../../mail/mail.service';

const ALLOWED_TRANSITIONS: Record<CddRequestStatus, CddRequestStatus[]> = {
  [CddRequestStatus.DRAFT]: [CddRequestStatus.SENT],
  [CddRequestStatus.SENT]: [CddRequestStatus.AWAITING_DOCS, CddRequestStatus.CLOSED],
  [CddRequestStatus.AWAITING_DOCS]: [CddRequestStatus.UNDER_REVIEW, CddRequestStatus.CLOSED],
  [CddRequestStatus.UNDER_REVIEW]: [CddRequestStatus.APPROVED, CddRequestStatus.REJECTED],
  [CddRequestStatus.APPROVED]: [CddRequestStatus.CLOSED],
  [CddRequestStatus.REJECTED]: [CddRequestStatus.UNDER_REVIEW, CddRequestStatus.CLOSED],
  [CddRequestStatus.CLOSED]: [],
};

const CDD_SORT_COLUMNS: Record<string, string> = {
  referenceNumber: 'request.referenceNumber',
  status: 'request.status',
  priority: 'request.priority',
  dueDate: 'request.dueDate',
  createdAt: 'request.createdAt',
  customer: 'customer.name',
  assignedTo: 'assignedTo.lastName',
};

@Injectable()
export class CddRequestsService {
  constructor(
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(EmailLog) private emailLogRepo: Repository<EmailLog>,
    @InjectQueue('reminder-email') private reminderQueue: Queue,
    private portalService: PortalService,
    private mailService: MailService,
  ) {}

  private generateReference(): string {
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 900000) + 100000;
    return `CDD-${year}-${seq}`;
  }

  async findAll(query: CddRequestQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.cddRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.customer', 'customer')
      .leftJoinAndSelect('request.assignedTo', 'assignedTo');

    if (query.status) {
      qb.andWhere('request.status = :status', { status: query.status });
    }
    if (query.priority) {
      qb.andWhere('request.priority = :priority', { priority: query.priority });
    }
    if (query.customerId) {
      qb.andWhere('request.customerId = :customerId', { customerId: query.customerId });
    }
    if (query.search) {
      qb.andWhere(
        '(request.referenceNumber ILIKE :search OR customer.name ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    applySort(
      qb,
      query.sortBy,
      query.sortOrder,
      CDD_SORT_COLUMNS,
      'request.createdAt',
    );
    qb.skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const request = await this.cddRepo.findOne({
      where: { id },
      relations: {
        customer: true,
        assignedTo: true,
        documents: { document: true },
        emailLogs: true,
      },
    });
    if (!request) throw new NotFoundException('CDD request not found');
    return request;
  }

  async create(dto: CreateCddRequestDto) {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const request = this.cddRepo.create({
      ...dto,
      referenceNumber: this.generateReference(),
      dueDate: new Date(dto.dueDate),
      status: CddRequestStatus.DRAFT,
    });
    return this.cddRepo.save(request);
  }

  async update(id: string, dto: UpdateCddRequestDto) {
    const request = await this.findOne(id);
    if (request.status === CddRequestStatus.CLOSED) {
      throw new BadRequestException('Cannot update a closed request');
    }
    Object.assign(request, {
      ...dto,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : request.dueDate,
    });
    return this.cddRepo.save(request);
  }

  async remove(id: string) {
    const request = await this.findOne(id);
    if (request.status !== CddRequestStatus.DRAFT) {
      throw new BadRequestException('Only draft requests can be deleted');
    }
    await this.cddRepo.remove(request);
    return { message: 'CDD request deleted successfully' };
  }

  async transitionStatus(id: string, dto: TransitionStatusDto) {
    const request = await this.findOne(id);
    const allowed = ALLOWED_TRANSITIONS[request.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${request.status} to ${dto.status}`,
      );
    }
    request.status = dto.status;
    if (dto.notes) {
      request.notes = dto.notes;
    }
    return this.cddRepo.save(request);
  }

  async sendReminder(id: string) {
    const request = await this.findOne(id);
    if ([CddRequestStatus.CLOSED, CddRequestStatus.APPROVED].includes(request.status)) {
      throw new BadRequestException('Cannot send reminder for this request status');
    }

    const { portalUrl } = await this.portalService.createToken(request.id);

    await this.reminderQueue.add('send-reminder', {
      cddRequestId: request.id,
      customerEmail: request.customer.email,
      referenceNumber: request.referenceNumber,
      dueDate: request.dueDate,
      portalUrl,
    });

    if (request.status === CddRequestStatus.DRAFT) {
      await this.cddRepo.update(request.id, { status: CddRequestStatus.SENT });
    }

    const delivery = this.mailService.getDeliveryInfo();

    return {
      message: delivery.isDevCapture
        ? 'Reminder queued — email will appear in Mailhog (dev capture), not a real inbox'
        : 'Reminder queued for delivery',
      recipient: request.customer.email,
      portalUrl,
      delivery,
    };
  }

  async getTimeline(id: string) {
    const request = await this.findOne(id);

    const auditLogs = await this.auditRepo.find({
      where: { entityId: id },
      order: { createdAt: 'ASC' },
      relations: { actor: true },
    });

    const emailLogs = await this.emailLogRepo.find({
      where: { cddRequestId: id },
      order: { createdAt: 'ASC' },
    });

    const events = [
      {
        type: 'created',
        timestamp: request.createdAt,
        description: `CDD request ${request.referenceNumber} created`,
      },
      ...auditLogs.map((log) => ({
        type: 'audit',
        timestamp: log.createdAt,
        description: log.action,
        actor: log.actor
          ? `${log.actor.firstName} ${log.actor.lastName}`
          : 'System',
      })),
      ...emailLogs.map((log) => ({
        type: 'email',
        timestamp: log.createdAt,
        description: `Email sent: ${log.subject}`,
        status: log.status,
      })),
    ].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    return { requestId: id, referenceNumber: request.referenceNumber, events };
  }
}
