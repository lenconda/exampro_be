import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { User } from '../user/user.entity';
// import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
// @ts-ignore
import apprc from '../../.apprc';

@Module({
  imports: [
    PassportModule,
    // TypeOrmModule.forFeature([User]),
    JwtModule.register(apprc.jwt),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
