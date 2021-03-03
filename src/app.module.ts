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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      ...apprc.db,
      entities: getMetadataArgsStorage().tables.map((table) => table.target),
      keepConnectionAlive: true,
      synchronize: true,
    } as TypeOrmModuleOptions),
    AuthModule,
    MailerModule.forRoot({
      transport: apprc.smtp,
      template: {
        dir: path.join(process.cwd(), 'src/utils/mail/'),
        adapter: new EjsAdapter(),
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
