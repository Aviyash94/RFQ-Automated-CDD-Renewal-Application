import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import {
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
  PreviewEmailDto,
  SendEmailDto,
  EmailLogQueryDto,
} from './dto/email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';

@ApiTags('Emails')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('emails')
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  @Get('templates')
  @Permissions('emails:read')
  @ApiOperation({ summary: 'List email templates' })
  findAllTemplates() {
    return this.emailsService.findAllTemplates();
  }

  @Get('templates/:id')
  @Permissions('emails:read')
  @ApiOperation({ summary: 'Get email template by ID' })
  findTemplate(@Param('id') id: string) {
    return this.emailsService.findTemplate(id);
  }

  @Post('templates')
  @Permissions('emails:write')
  @ApiOperation({ summary: 'Create email template' })
  createTemplate(@Body() dto: CreateEmailTemplateDto) {
    return this.emailsService.createTemplate(dto);
  }

  @Patch('templates/:id')
  @Permissions('emails:write')
  @ApiOperation({ summary: 'Update email template' })
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.emailsService.updateTemplate(id, dto);
  }

  @Delete('templates/:id')
  @Permissions('emails:write')
  @ApiOperation({ summary: 'Delete email template' })
  removeTemplate(@Param('id') id: string) {
    return this.emailsService.removeTemplate(id);
  }

  @Post('preview')
  @Permissions('emails:read')
  @ApiOperation({ summary: 'Preview rendered email template' })
  preview(@Body() dto: PreviewEmailDto) {
    return this.emailsService.preview(dto);
  }

  @Post('send')
  @Permissions('emails:send')
  @ApiOperation({ summary: 'Send email using template' })
  send(@Body() dto: SendEmailDto) {
    return this.emailsService.send(dto);
  }

  @Get('logs')
  @Permissions('emails:read')
  @ApiOperation({ summary: 'List email logs' })
  findLogs(@Query() query: EmailLogQueryDto) {
    return this.emailsService.findLogs(query);
  }
}
