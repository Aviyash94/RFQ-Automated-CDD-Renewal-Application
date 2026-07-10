import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate } from '../../database/entities/email-template.entity';
import { EmailLog } from '../../database/entities/email-log.entity';
import { EmailStatus } from '../../common/enums';
import { paginate } from '../../common/dto/pagination.dto';
import { MailService } from '../../mail/mail.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  PreviewEmailDto,
  SendEmailDto,
  EmailLogQueryDto,
} from './dto/email.dto';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(EmailTemplate) private templateRepo: Repository<EmailTemplate>,
    @InjectRepository(EmailLog) private logRepo: Repository<EmailLog>,
    private mailService: MailService,
  ) {}

  async findAllTemplates() {
    return this.templateRepo.find({ order: { name: 'ASC' } });
  }

  async findTemplate(id: string) {
    const template = await this.templateRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Email template not found');
    return template;
  }

  async findTemplateByKey(key: string) {
    const template = await this.templateRepo.findOne({ where: { key } });
    if (!template) throw new NotFoundException(`Template '${key}' not found`);
    return template;
  }

  async createTemplate(dto: CreateEmailTemplateDto) {
    const existing = await this.templateRepo.findOne({ where: { key: dto.key } });
    if (existing) {
      throw new BadRequestException(`Template key '${dto.key}' already exists`);
    }
    return this.templateRepo.save(dto);
  }

  async updateTemplate(id: string, dto: UpdateEmailTemplateDto) {
    const template = await this.findTemplate(id);
    Object.assign(template, dto);
    return this.templateRepo.save(template);
  }

  async removeTemplate(id: string) {
    const template = await this.findTemplate(id);
    await this.templateRepo.remove(template);
    return { message: 'Email template deleted successfully' };
  }

  async preview(dto: PreviewEmailDto) {
    const template = await this.findTemplateByKey(dto.templateKey);
    const variables = dto.variables || {};
    return {
      subject: this.mailService.renderTemplate(template.subject, variables),
      body: this.mailService.renderTemplate(template.body, variables),
    };
  }

  async send(dto: SendEmailDto) {
    const template = await this.findTemplateByKey(dto.templateKey);
    if (!template.isActive) {
      throw new BadRequestException('Template is not active');
    }

    const variables = dto.variables || {};
    const subject = this.mailService.renderTemplate(template.subject, variables);
    const body = this.mailService.renderTemplate(template.body, variables);

    const log = await this.logRepo.save({
      cddRequestId: dto.cddRequestId || null,
      templateKey: template.key,
      recipient: dto.recipient,
      subject,
      body,
      status: EmailStatus.PENDING,
    });

    try {
      await this.mailService.sendMail({
        to: dto.recipient,
        subject,
        html: body,
      });
      await this.logRepo.update(log.id, {
        status: EmailStatus.SENT,
        sentAt: new Date(),
      });
    } catch (error) {
      await this.logRepo.update(log.id, {
        status: EmailStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return this.logRepo.findOne({ where: { id: log.id } });
  }

  async findLogs(query: EmailLogQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.logRepo.createQueryBuilder('log');

    if (query.cddRequestId) {
      qb.andWhere('log.cddRequestId = :cddRequestId', {
        cddRequestId: query.cddRequestId,
      });
    }
    if (query.templateKey) {
      qb.andWhere('log.templateKey = :templateKey', {
        templateKey: query.templateKey,
      });
    }

    qb.orderBy('log.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }
}
