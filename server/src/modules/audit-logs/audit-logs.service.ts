import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { paginate } from '../../common/dto/pagination.dto';
import { AuditLogQueryDto } from './dto/audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
  ) {}

  async findAll(query: AuditLogQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.auditRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.actor', 'actor');

    if (query.actorId) {
      qb.andWhere('log.actorId = :actorId', { actorId: query.actorId });
    }
    if (query.entityType) {
      qb.andWhere('log.entityType ILIKE :entityType', {
        entityType: `%${query.entityType}%`,
      });
    }
    if (query.action) {
      qb.andWhere('log.action ILIKE :action', { action: `%${query.action}%` });
    }
    if (query.fromDate && query.toDate) {
      qb.andWhere('log.createdAt BETWEEN :from AND :to', {
        from: new Date(query.fromDate),
        to: new Date(query.toDate),
      });
    }

    qb.orderBy('log.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }
}
