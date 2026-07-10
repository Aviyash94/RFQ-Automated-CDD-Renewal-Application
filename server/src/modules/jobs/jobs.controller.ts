import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('jobs')
export class JobsController {
  constructor(private jobsService: JobsService) {}

  @Get()
  @Permissions('jobs:read')
  @ApiOperation({ summary: 'List background job runs' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('jobName') jobName?: string,
  ) {
    return this.jobsService.findAll(Number(page) || 1, Number(limit) || 20, jobName);
  }

  @Post('cdd-renewal-scan')
  @Permissions('jobs:manage')
  @ApiOperation({ summary: 'Trigger CDD renewal scan job' })
  triggerRenewalScan() {
    return this.jobsService.triggerCddRenewalScan();
  }

  @Post('oracle-sync')
  @Permissions('jobs:manage')
  @ApiOperation({ summary: 'Trigger Oracle sync job' })
  triggerOracleSync() {
    return this.jobsService.triggerOracleSync();
  }
}
