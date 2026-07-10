import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  NotificationQueryDto,
  MarkReadDto,
} from './dto/notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'List notifications for current user' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(user, query);
  }

  @Post()
  @Permissions('notifications:write')
  @ApiOperation({ summary: 'Create a notification' })
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch('mark-read')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  markRead(@CurrentUser() user: AuthUser, @Body() dto: MarkReadDto) {
    return this.notificationsService.markRead(user, dto);
  }

  @Patch(':id/read')
  @Permissions('notifications:read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  markOneRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationsService.markOneRead(user, id);
  }
}
