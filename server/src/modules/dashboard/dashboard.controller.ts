import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('kpis')
  @Permissions('dashboard:read')
  @ApiOperation({ summary: 'Get dashboard KPIs' })
  getKpis(@CurrentUser() user: AuthUser) {
    return this.dashboardService.getKpis(user);
  }

  @Get('charts')
  @Permissions('dashboard:read')
  @ApiOperation({ summary: 'Get dashboard chart data' })
  getChartData() {
    return this.dashboardService.getChartData();
  }
}
