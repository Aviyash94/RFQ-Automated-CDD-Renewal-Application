import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../../database/entities/notification.entity';
import { paginate } from '../../common/dto/pagination.dto';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  MarkReadDto,
} from './dto/notification.dto';
import { AuthUser } from '../../common/decorators/current-user.decorator';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private notificationRepo: Repository<Notification>,
  ) {}

  async findAll(user: AuthUser, query: NotificationQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.notificationRepo
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId: user.id });

    if (query.unreadOnly) {
      qb.andWhere('notification.isRead = false');
    }

    qb.orderBy('notification.createdAt', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return paginate(data, total, page, limit);
  }

  async create(dto: CreateNotificationDto) {
    return this.notificationRepo.save(dto);
  }

  async markRead(user: AuthUser, dto: MarkReadDto) {
    const where: Record<string, unknown> = { userId: user.id, isRead: false };
    if (dto.ids?.length) {
      where.id = In(dto.ids);
    }

    const result = await this.notificationRepo.update(where, { isRead: true });
    return { message: 'Notifications marked as read', count: result.affected || 0 };
  }

  async markOneRead(user: AuthUser, id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId: user.id },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    notification.isRead = true;
    return this.notificationRepo.save(notification);
  }
}
