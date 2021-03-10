import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/role/role.guard';
import { CurrentUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.entity';
import { NotificationService, NotificationType } from './notification.service';

@Controller('/api/notifications')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  async publish(@CurrentUser() user: User, @Body() notification: any) {
    return await this.notificationService.publish(user, notification);
  }

  @Get()
  async getAllPublicNotifications(
    @CurrentUser() user: User,
    @Query('last_cursor') lastCursor = '0',
    @Query('size') size = '10',
    @Query('type') type: NotificationType = 'public',
  ) {
    return await this.notificationService.getNotifications(
      user,
      parseInt(lastCursor),
      parseInt(size),
      type,
    );
  }

  @Patch(':id')
  async check(@CurrentUser() user: User, @Param('id') id: number) {
    return await this.notificationService.check(user, id);
  }
}
