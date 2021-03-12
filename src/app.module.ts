import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getMetadataArgsStorage } from 'typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import path from 'path';
import { UserModule } from './user/user.module';
import { RoleModule } from './role/role.module';
import { NotificationModule } from './notification/notification.module';
import { Role } from './role/role.entity';
import { User } from './user/user.entity';
import { UserRole } from './role/user_role.entity';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RedisModule } from 'nestjs-redis';
import { ConfigService } from './config/config.service';
import { ConfigModule } from './config/config.module';
import { MenuModule } from './menu/menu.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { QuestionModule } from './question/question.module';
import { PaperModule } from './paper/paper.module';
import { AppInterceptor } from './app.interceptor';
import { ExamModule } from './exam/exam.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: async (config: ConfigService) => {
        return {
          ...config.get('db'),
          entities: getMetadataArgsStorage().tables.map(
            (table) => table.target,
          ),
          keepConnectionAlive: true,
          synchronize: true,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Role, User, UserRole]),
    RedisModule.forRootAsync({
      useFactory: async (config: ConfigService) => config.get('redis'),
      inject: [ConfigService],
    }),
    AuthModule,
    MailerModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          transport: config.get('smtp'),
          template: {
            dir: path.join(process.cwd(), 'src/utils/mail/'),
            adapter: new EjsAdapter(),
          },
        };
      },
      inject: [ConfigService],
    }),
    ConfigModule,
    UserModule,
    RoleModule,
    NotificationModule,
    MenuModule,
    AdminModule,
    MailModule,
    QuestionModule,
    PaperModule,
    ExamModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AppInterceptor,
    },
  ],
})
export class AppModule {}
