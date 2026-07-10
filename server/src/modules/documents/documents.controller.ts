import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { DocumentQueryDto, LinkDocumentDto } from './dto/document.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';
import { DocumentType } from '../../common/enums';

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Get()
  @Permissions('documents:read')
  @ApiOperation({ summary: 'List documents with pagination and filters' })
  findAll(@Query() query: DocumentQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id/preview')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'Preview document inline (PDF/images)' })
  async preview(
    @Param('id') id: string,
    @Res({ passthrough: true }) _res: Response,
  ): Promise<StreamableFile> {
    return this.documentsService.preview(id);
  }

  @Get(':id/download')
  @Permissions('documents:download')
  @ApiOperation({ summary: 'Download document file' })
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) _res: Response,
  ): Promise<StreamableFile> {
    return this.documentsService.download(id);
  }

  @Get(':id')
  @Permissions('documents:read')
  @ApiOperation({ summary: 'Get document metadata by ID' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Post('upload')
  @Permissions('documents:upload')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          cb(null, resolve(process.cwd(), 'uploads'));
        },
        filename: (_req, file, cb) => {
          cb(null, `${uuidv4()}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: DocumentType,
    @Body('cddRequestId') cddRequestId?: string,
  ) {
    return this.documentsService.upload(file, documentType, cddRequestId);
  }

  @Post('link')
  @Permissions('documents:write')
  @ApiOperation({ summary: 'Link document to CDD request' })
  link(@Body() dto: LinkDocumentDto) {
    return this.documentsService.linkToCddRequest(dto);
  }

  @Delete(':id')
  @Permissions('documents:write')
  @ApiOperation({ summary: 'Delete a document' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
