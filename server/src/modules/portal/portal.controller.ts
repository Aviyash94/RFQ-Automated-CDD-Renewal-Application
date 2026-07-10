import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { randomUUID } from 'crypto';
import { PortalService } from './portal.service';
import { Public, Permissions } from '../../common/decorators/roles.decorator';
import { SubmitRiskDataDto, PortalUploadDto } from './dto/portal.dto';
import { DocumentType } from '../../common/enums';

@ApiTags('Customer Portal')
@Controller('portal')
export class PortalController {
  constructor(private portalService: PortalService) {}

  // Staff routes must be registered before :token to avoid path capture
  @Post('staff/requests/:cddRequestId/token')
  @ApiBearerAuth()
  @Permissions('cdd-requests:write')
  @ApiOperation({ summary: 'Generate customer portal link for a CDD request' })
  createToken(@Param('cddRequestId') cddRequestId: string) {
    return this.portalService.createToken(cddRequestId);
  }

  @Get('staff/requests/:cddRequestId/tokens')
  @ApiBearerAuth()
  @Permissions('cdd-requests:read')
  @ApiOperation({ summary: 'List portal tokens for a CDD request' })
  listTokens(@Param('cddRequestId') cddRequestId: string) {
    return this.portalService.listTokensForRequest(cddRequestId);
  }

  @Get('staff/requests/:cddRequestId/risk-submission')
  @ApiBearerAuth()
  @Permissions('cdd-requests:read')
  @ApiOperation({ summary: 'Get portal risk data submission' })
  getRisk(@Param('cddRequestId') cddRequestId: string) {
    return this.portalService.getRiskSubmissionForRequest(cddRequestId);
  }

  @Public()
  @Get(':token')
  @ApiOperation({ summary: 'Get portal session for a customer token' })
  getSession(@Param('token') token: string) {
    return this.portalService.getPortalSession(token);
  }

  @Public()
  @Post(':token/documents')
  @ApiOperation({ summary: 'Upload Annex A document via customer portal' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, resolve(process.cwd(), 'uploads'));
        },
        filename: (_req, file, cb) => {
          cb(null, `${randomUUID()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @Param('token') token: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: PortalUploadDto,
  ) {
    if (!file) throw new BadRequestException('File is required');
    return this.portalService.uploadDocument(
      token,
      file,
      body.documentType as DocumentType,
    );
  }

  @Public()
  @Post(':token/risk-data')
  @ApiOperation({ summary: 'Submit critical customer risk data' })
  submitRiskData(@Param('token') token: string, @Body() dto: SubmitRiskDataDto) {
    return this.portalService.submitRiskData(token, dto);
  }

  @Public()
  @Post(':token/submit')
  @ApiOperation({ summary: 'Finalize portal submission' })
  finalize(@Param('token') token: string) {
    return this.portalService.finalizeSubmission(token);
  }
}
