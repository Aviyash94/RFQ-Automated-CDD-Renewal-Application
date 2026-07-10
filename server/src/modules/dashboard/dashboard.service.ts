import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In } from 'typeorm';
import { Customer } from '../../database/entities/customer.entity';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { Document } from '../../database/entities/document.entity';
import { Notification } from '../../database/entities/notification.entity';
import { CddRequestStatus, ValidationStatus } from '../../common/enums';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    @InjectRepository(CddRequest) private cddRepo: Repository<CddRequest>,
    @InjectRepository(Document) private documentRepo: Repository<Document>,
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
  ) {}

  async getKpis(user: AuthUser) {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalCustomers,
      activeCddRequests,
      overdueRequests,
      expiringCdd,
      pendingDocuments,
      unreadNotifications,
    ] = await Promise.all([
      this.customerRepo.count(),
      this.cddRepo.count({
        where: {
          status: Not(
            In([CddRequestStatus.APPROVED, CddRequestStatus.CLOSED, CddRequestStatus.REJECTED]),
          ),
        },
      }),
      this.cddRepo
        .createQueryBuilder('r')
        .where('r.dueDate < :now', { now })
        .andWhere('r.status NOT IN (:...statuses)', {
          statuses: [CddRequestStatus.APPROVED, CddRequestStatus.CLOSED],
        })
        .getCount(),
      this.customerRepo.count({
        where: {
          cddExpiryDate: LessThan(thirtyDaysFromNow),
        },
      }),
      this.documentRepo.count({ where: { validationStatus: ValidationStatus.PENDING } }),
      this.notificationRepo.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return {
      totalCustomers,
      activeCddRequests,
      overdueRequests,
      expiringCdd,
      pendingDocuments,
      unreadNotifications,
    };
  }

  async getChartData() {
    const statusChart = await this.cddRepo
      .createQueryBuilder('r')
      .select('r.status', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('r.status')
      .getRawMany();

    const monthlyTrend = await this.cddRepo
      .createQueryBuilder('r')
      .select("TO_CHAR(r.createdAt, 'YYYY-MM')", 'month')
      .addSelect('COUNT(*)', 'count')
      .groupBy("TO_CHAR(r.createdAt, 'YYYY-MM')")
      .orderBy('month', 'ASC')
      .limit(12)
      .getRawMany();

    const riskDistribution = await this.customerRepo
      .createQueryBuilder('c')
      .select('c.riskRating', 'label')
      .addSelect('COUNT(*)', 'value')
      .groupBy('c.riskRating')
      .getRawMany();

    const recentRequests = await this.cddRepo.find({
      relations: { customer: true },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      statusChart: statusChart.map((r) => ({
        label: r.label,
        value: Number(r.value),
      })),
      monthlyTrend: monthlyTrend.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
      riskDistribution: riskDistribution.map((r) => ({
        label: r.label,
        value: Number(r.value),
      })),
      recentRequests: recentRequests.map((r) => ({
        id: r.id,
        referenceNumber: r.referenceNumber,
        customerName: r.customer?.name,
        status: r.status,
        dueDate: r.dueDate,
        createdAt: r.createdAt,
      })),
    };
  }
}
