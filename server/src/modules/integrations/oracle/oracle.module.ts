import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { OracleCustomerRepository } from './oracle-customer.repository';
import { CUSTOMER_SOURCE_REPOSITORY } from './customer-source.repository';

@Module({
  imports: [BullModule.registerQueue({ name: 'oracle-sync' })],
  controllers: [OracleController],
  providers: [
    OracleService,
    OracleCustomerRepository,
    {
      provide: CUSTOMER_SOURCE_REPOSITORY,
      useExisting: OracleCustomerRepository,
    },
  ],
  exports: [OracleService, CUSTOMER_SOURCE_REPOSITORY, OracleCustomerRepository],
})
export class OracleModule {}
