import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ZodSerializerDto } from 'nestjs-zod';
import { NotificationService } from './notification.service';
import {
  NotificationListResDTO,
  UnreadCountResDTO,
} from './notification.dto';
import { ActiveUser } from '../shared/decorators/active-user.decorator';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ZodSerializerDto(NotificationListResDTO)
  list(
    @ActiveUser('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationService.listForUser(
      userId,
      Math.max(1, Math.min(100, Number(limit) || 30)),
    );
  }

  @Get('unread-count')
  @ZodSerializerDto(UnreadCountResDTO)
  unreadCount(@ActiveUser('userId') userId: string) {
    return this.notificationService.unreadCount(userId);
  }

  @Patch('read-all')
  markAllRead(@ActiveUser('userId') userId: string) {
    return this.notificationService.markAllRead(userId);
  }

  @Patch(':id/read')
  markRead(@ActiveUser('userId') userId: string, @Param('id') id: string) {
    return this.notificationService.markRead(userId, id);
  }
}
