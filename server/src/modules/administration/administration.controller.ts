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
import { AdministrationService } from './administration.service';
import {
  UpdateSettingsDto,
  CreateReminderRuleDto,
  UpdateReminderRuleDto,
  JobMonitorQueryDto,
} from './dto/administration.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';

@ApiTags('Administration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('administration')
export class AdministrationController {
  constructor(private administrationService: AdministrationService) {}

  @Get('settings')
  @Permissions('administration:read')
  @ApiOperation({ summary: 'Get application settings' })
  getSettings() {
    return this.administrationService.getSettings();
  }

  @Patch('settings')
  @Permissions('administration:write')
  @ApiOperation({ summary: 'Update application settings' })
  updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.administrationService.updateSettings(dto);
  }

  @Get('reminder-rules')
  @Permissions('administration:read')
  @ApiOperation({ summary: 'List reminder rules' })
  findAllReminderRules() {
    return this.administrationService.findAllReminderRules();
  }

  @Post('reminder-rules')
  @Permissions('administration:write')
  @ApiOperation({ summary: 'Create reminder rule' })
  createReminderRule(@Body() dto: CreateReminderRuleDto) {
    return this.administrationService.createReminderRule(dto);
  }

  @Patch('reminder-rules/:id')
  @Permissions('administration:write')
  @ApiOperation({ summary: 'Update reminder rule' })
  updateReminderRule(@Param('id') id: string, @Body() dto: UpdateReminderRuleDto) {
    return this.administrationService.updateReminderRule(id, dto);
  }

  @Delete('reminder-rules/:id')
  @Permissions('administration:write')
  @ApiOperation({ summary: 'Delete reminder rule' })
  removeReminderRule(@Param('id') id: string) {
    return this.administrationService.removeReminderRule(id);
  }

  @Get('jobs')
  @Permissions('administration:read')
  @ApiOperation({ summary: 'Monitor background job runs' })
  getJobMonitor(@Query() query: JobMonitorQueryDto) {
    return this.administrationService.getJobMonitor(query);
  }
}
