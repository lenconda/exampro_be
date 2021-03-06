import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { UserRole } from 'src/role/user_role.entity';
import { Role } from 'src/role/role.entity';
import { ConfigService } from 'src/config/config.service';
import { UserModule } from 'src/user/user.module';

@Global()
@Module({
  imports: [
    PassportModule,
    UserModule,
    TypeOrmModule.forFeature([User, UserRole, Role]),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => config.get('jwt'),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
