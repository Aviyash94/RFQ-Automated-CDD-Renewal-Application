import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('cdd-summary')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'CDD request summary report' })
  getCddSummary(@Query() query: ReportQueryDto) {
    return this.reportsService.getCddSummary(query);
  }

  @Get('sla-metrics')
  @Permissions('reports:read')
  @ApiOperation({ summary: 'SLA compliance metrics' })
  getSlaMetrics(@Query() query: ReportQueryDto) {
    return this.reportsService.getSlaMetrics(query);
  }

  @Get('export/csv')
  @Permissions('reports:export')
  @ApiOperation({ summary: 'Export CDD requests as CSV' })
  async exportCsv(@Query() query: ReportQueryDto, @Res() res: Response) {
    const csv = await this.reportsService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="cdd-report-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
