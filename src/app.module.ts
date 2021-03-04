import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getMetadataArgsStorage } from 'typeorm';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';

// @ts-ignore
import apprc from '../.apprc';

import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import path from 'path';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { NotificationModule } from './notification/notification.module';
import { Role } from './role/role.entity';
import { User } from './user/user.entity';
import { UserRole } from './role/user_role.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...apprc.db,
      entities: getMetadataArgsStorage().tables.map((table) => table.target),
      keepConnectionAlive: true,
      synchronize: true,
    } as TypeOrmModuleOptions),
    TypeOrmModule.forFeature([Role, User, UserRole]),
    AuthModule,
    MailerModule.forRoot({
      transport: apprc.smtp,
      template: {
        dir: path.join(process.cwd(), 'src/utils/mail/'),
        adapter: new EjsAdapter(),
      },
    }),
    UserModule,
    RoleModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
