import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalToken } from '../../database/entities/portal-token.entity';
import { PortalRiskSubmission } from '../../database/entities/portal-risk-submission.entity';
import { CddRequest } from '../../database/entities/cdd-request.entity';
import { DocumentsModule } from '../documents/documents.module';
import { DocumentValidationModule } from '../document-validation/document-validation.module';
import { PortalController } from './portal.controller';
import { PortalService } from './portal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PortalToken, PortalRiskSubmission, CddRequest]),
    DocumentsModule,
    DocumentValidationModule,
  ],
  controllers: [PortalController],
  providers: [PortalService],
  exports: [PortalService],
})
export class PortalModule {}
