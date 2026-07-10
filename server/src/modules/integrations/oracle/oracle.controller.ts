import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OracleService } from './oracle.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/roles.decorator';

@ApiTags('Integrations - Oracle')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('integrations/oracle')
export class OracleController {
  constructor(private oracleService: OracleService) {}

  @Get('health')
  @Permissions('integrations:read')
  @ApiOperation({ summary: 'Oracle integration health check' })
  health() {
    return this.oracleService.healthCheck();
  }

  @Post('sync')
  @Permissions('integrations:write')
  @ApiOperation({ summary: 'Trigger Oracle customer sync (stub)' })
  sync() {
    return this.oracleService.triggerSync();
  }
}
