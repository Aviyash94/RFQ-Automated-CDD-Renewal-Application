import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderRule } from '../../database/entities/reminder-rule.entity';
import { JobRun } from '../../database/entities/job-run.entity';
import { paginate } from '../../common/dto/pagination.dto';
import {
  UpdateSettingsDto,
  CreateReminderRuleDto,
  UpdateReminderRuleDto,
  JobMonitorQueryDto,
} from './dto/administration.dto';

export interface AppSettings {
  defaultSlaDays: number;
  autoRemindersEnabled: boolean;
  aiValidationEnabled: boolean;
  organizationName: string;
}

@Injectable()
export class AdministrationService {
  private settings: AppSettings = {
    defaultSlaDays: 30,
    autoRemindersEnabled: true,
    aiValidationEnabled: true,
    organizationName: 'SICOM CDD Renewal',
  };

  constructor(
    @InjectRepository(ReminderRule) private reminderRuleRepo: Repository<ReminderRule>,
    @InjectRepository(JobRun) private jobRunRepo: Repository<JobRun>,
  ) {}

  getSettings(): AppSettings {
    return { ...this.settings };
  }

  updateSettings(dto: UpdateSettingsDto): AppSettings {
    this.settings = { ...this.settings, ...dto };
    return this.getSettings();
  }

  async findAllReminderRules() {
    return this.reminderRuleRepo.find({ order: { daysBeforeDue: 'ASC' } });
  }

  async findReminderRule(id: string) {
    const rule = await this.reminderRuleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException('Reminder rule not found');
    return rule;
  }

  async createReminderRule(dto: CreateReminderRuleDto) {
    return this.reminderRuleRepo.save(dto);
  }

  async updateReminderRule(id: string, dto: UpdateReminderRuleDto) {
    const rule = await this.findReminderRule(id);
    Object.assign(rule, dto);
    return this.reminderRuleRepo.save(rule);
  }

  async removeReminderRule(id: string) {
    const rule = await this.findReminderRule(id);
    await this.reminderRuleRepo.remove(rule);
    return { message: 'Reminder rule deleted successfully' };
  }

  async getJobMonitor(query: JobMonitorQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.jobRunRepo.createQueryBuilder('job');
    if (query.jobName) {
      qb.andWhere('job.jobName = :jobName', { jobName: query.jobName });
    }
    qb.orderBy('job.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }
}
