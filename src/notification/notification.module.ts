import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { UserNotification } from './user_notification.entity';
import { User } from 'src/user/user.entity';

@Module({
  providers: [NotificationService],
  controllers: [NotificationController],
  imports: [TypeOrmModule.forFeature([Notification, UserNotification, User])],
})
export class NotificationModule {}
