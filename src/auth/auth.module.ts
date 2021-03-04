import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
// @ts-ignore
import apprc from '../../.apprc';
import { UserRole } from 'src/role/user_role.entity';
import { Role } from 'src/role/role.entity';

@Global()
@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, UserRole, Role]),
    JwtModule.register(apprc.jwt),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
