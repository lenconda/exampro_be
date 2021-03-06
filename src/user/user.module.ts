import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/role/role.entity';
import { UserRole } from 'src/role/user_role.entity';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RedisModule } from 'nestjs-redis';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Role]), RedisModule],
  providers: [UserService],
  exports: [UserService],
  controllers: [UserController],
})
export class UserModule {}
