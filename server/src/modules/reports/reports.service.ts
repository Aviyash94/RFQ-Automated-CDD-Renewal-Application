import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual } from 'typeorm';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { Customer } from '../../database/entities/customer.entity';
import { CddRequestStatus } from '../../common/enums';
import { ReportQueryDto } from './dto/report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
  ) {}

  private applyDateFilter(
    qb: ReturnType<Repository<CddRequest>['createQueryBuilder']>,
    query: ReportQueryDto,
    alias = 'request',
  ) {
    if (query.fromDate && query.toDate) {
      qb.andWhere(`${alias}.createdAt BETWEEN :from AND :to`, {
        from: new Date(query.fromDate),
        to: new Date(query.toDate),
      });
    } else if (query.fromDate) {
      qb.andWhere(`${alias}.createdAt >= :from`, { from: new Date(query.fromDate) });
    } else if (query.toDate) {
      qb.andWhere(`${alias}.createdAt <= :to`, { to: new Date(query.toDate) });
    }
    if (query.status) {
      qb.andWhere(`${alias}.status = :status`, { status: query.status });
    }
  }

  async getCddSummary(query: ReportQueryDto) {
    const qb = this.cddRepo.createQueryBuilder('request');
    this.applyDateFilter(qb, query);

    const total = await qb.getCount();

    const byStatus = await this.cddRepo
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status')
      .getRawMany();

    const byPriority = await this.cddRepo
      .createQueryBuilder('request')
      .select('request.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.priority')
      .getRawMany();

    return {
      total,
      byStatus: byStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
      byPriority: byPriority.map((r) => ({ priority: r.priority, count: Number(r.count) })),
      generatedAt: new Date().toISOString(),
    };
  }

  async getSlaMetrics(query: ReportQueryDto) {
    const qb = this.cddRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.customer', 'customer');
    this.applyDateFilter(qb, query);

    const requests = await qb.getMany();
    const now = new Date();

    const overdue = requests.filter(
      (r) =>
        r.dueDate < now &&
        ![CddRequestStatus.APPROVED, CddRequestStatus.CLOSED].includes(r.status),
    );

    const completed = requests.filter((r) =>
      [CddRequestStatus.APPROVED, CddRequestStatus.CLOSED].includes(r.status),
    );

    const onTime = completed.filter((r) => r.updatedAt <= r.dueDate);

    const slaComplianceRate =
      completed.length > 0
        ? Math.round((onTime.length / completed.length) * 100)
        : 100;

    const avgDaysToComplete =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, r) => {
              const days =
                (r.updatedAt.getTime() - r.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }, 0) / completed.length,
          )
        : 0;

    return {
      totalRequests: requests.length,
      overdueCount: overdue.length,
      completedCount: completed.length,
      onTimeCount: onTime.length,
      slaComplianceRate,
      avgDaysToComplete,
      overdueRequests: overdue.slice(0, 10).map((r) => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        customerName: r.customer?.name,
        dueDate: r.dueDate,
        status: r.status,
        daysOverdue: Math.ceil(
          (now.getTime() - r.dueDate.getTime()) / (1000 * 60 * 60 * 24),
        ),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  async exportCsv(query: ReportQueryDto): Promise<string> {
    const qb = this.cddRepo
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.customer', 'customer')
      .leftJoinAndSelect('request.assignedTo', 'assignedTo');
    this.applyDateFilter(qb, query);
    qb.orderBy('request.createdAt', 'DESC');

    const requests = await qb.getMany();

    const headers = [
      'Reference',
      'Customer',
      'Status',
      'Priority',
      'Due Date',
      'Assigned To',
      'Created At',
    ];

    const rows = requests.map((r) => [
      r.referenceNumber,
      r.customer?.name || '',
      r.status,
      r.priority,
      r.dueDate.toISOString().split('T')[0],
      r.assignedTo ? `${r.assignedTo.firstName} ${r.assignedTo.lastName}` : '',
      r.createdAt.toISOString(),
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  async getExpiringCustomers(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.customerRepo.find({
      where: {
        cddExpiryDate: Between(new Date(), futureDate),
      },
      order: { cddExpiryDate: 'ASC' },
      take: 50,
    });
  }
}
