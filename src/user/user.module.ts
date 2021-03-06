import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from 'src/role/role.entity';
import { UserRole } from 'src/role/user_role.entity';
import { User } from './user.entity';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Role])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
