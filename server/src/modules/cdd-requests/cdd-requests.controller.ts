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
import { CddRequestsService } from './cdd-requests.service';
import {
  CreateCddRequestDto,
  UpdateCddRequestDto,
  TransitionStatusDto,
  CddRequestQueryDto,
} from './dto/cdd-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';

@ApiTags('CDD Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('cdd-requests')
export class CddRequestsController {
  constructor(private cddRequestsService: CddRequestsService) {}

  @Get()
  @Permissions('cdd-requests:read')
  @ApiOperation({ summary: 'List CDD requests with pagination and filters' })
  findAll(@Query() query: CddRequestQueryDto) {
    return this.cddRequestsService.findAll(query);
  }

  @Get(':id')
  @Permissions('cdd-requests:read')
  @ApiOperation({ summary: 'Get CDD request by ID' })
  findOne(@Param('id') id: string) {
    return this.cddRequestsService.findOne(id);
  }

  @Get(':id/timeline')
  @Permissions('cdd-requests:read')
  @ApiOperation({ summary: 'Get CDD request timeline' })
  getTimeline(@Param('id') id: string) {
    return this.cddRequestsService.getTimeline(id);
  }

  @Post()
  @Permissions('cdd-requests:write')
  @ApiOperation({ summary: 'Create a CDD request' })
  create(@Body() dto: CreateCddRequestDto) {
    return this.cddRequestsService.create(dto);
  }

  @Patch(':id')
  @Permissions('cdd-requests:write')
  @ApiOperation({ summary: 'Update a CDD request' })
  update(@Param('id') id: string, @Body() dto: UpdateCddRequestDto) {
    return this.cddRequestsService.update(id, dto);
  }

  @Patch(':id/status')
  @Permissions('cdd-requests:write')
  @ApiOperation({ summary: 'Transition CDD request status' })
  transitionStatus(@Param('id') id: string, @Body() dto: TransitionStatusDto) {
    return this.cddRequestsService.transitionStatus(id, dto);
  }

  @Post(':id/send-reminder')
  @Permissions('cdd-requests:send-reminder')
  @ApiOperation({ summary: 'Send reminder email for CDD request' })
  sendReminder(@Param('id') id: string) {
    return this.cddRequestsService.sendReminder(id);
  }

  @Delete(':id')
  @Permissions('cdd-requests:write')
  @ApiOperation({ summary: 'Delete a draft CDD request' })
  remove(@Param('id') id: string) {
    return this.cddRequestsService.remove(id);
  }
}
