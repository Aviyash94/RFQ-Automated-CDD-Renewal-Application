import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderRule } from '../../database/entities/reminder-rule.entity';
import { JobRun } from '../../database/entities/job-run.entity';
import { AdministrationController } from './administration.controller';
import { AdministrationService } from './administration.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderRule, JobRun])],
  controllers: [AdministrationController],
  providers: [AdministrationService],
  exports: [AdministrationService],
})
export class AdministrationModule {}
