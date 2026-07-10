import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Document } from '../../database/entities/document.entity';
import { ValidationResult } from '../../database/entities/validation-result.entity';
import { DocumentValidationController } from './document-validation.controller';
import { DocumentValidationService } from './document-validation.service';
import { MockValidationProvider } from './providers/mock-validation.provider';
import { VALIDATION_PROVIDER } from './providers/validation-provider.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, ValidationResult]),
    BullModule.registerQueue({ name: 'document-ai-validate' }),
  ],
  controllers: [DocumentValidationController],
  providers: [
    DocumentValidationService,
    MockValidationProvider,
    {
      provide: VALIDATION_PROVIDER,
      useExisting: MockValidationProvider,
    },
  ],
  exports: [DocumentValidationService, VALIDATION_PROVIDER],
})
export class DocumentValidationModule {}
