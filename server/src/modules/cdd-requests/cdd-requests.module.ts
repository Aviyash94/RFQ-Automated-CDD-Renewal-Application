import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { Customer } from '../../database/entities/customer.entity';
import { AuditLog } from '../../database/entities/audit-log.entity';
import { EmailLog } from '../../database/entities/email-log.entity';
import { CddRequestsController } from './cdd-requests.controller';
import { CddRequestsService } from './cdd-requests.service';
import { PortalModule } from '../portal/portal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CddRequest, Customer, AuditLog, EmailLog]),
    BullModule.registerQueue({ name: 'reminder-email' }),
    forwardRef(() => PortalModule),
  ],
  controllers: [CddRequestsController],
  providers: [CddRequestsService],
  exports: [CddRequestsService],
})
export class CddRequestsModule {}
