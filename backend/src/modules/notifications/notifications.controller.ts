import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get in-app activity notifications and unread count' })
  getNotifications(@CurrentUser() user: any) {
    const tenantId = user.tenantId;
    const userId = user.sub || user.id;
    return this.notificationsService.getNotifications(tenantId, userId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllRead(@CurrentUser() user: any, @Body() body: { ids?: string[] }) {
    const userId = user.sub || user.id;
    const ids = body?.ids || [];
    return this.notificationsService.markAllRead(userId, ids);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  markRead(@CurrentUser() user: any, @Param('id') id: string) {
    const userId = user.sub || user.id;
    return this.notificationsService.markRead(userId, id);
  }
}
