import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { UserRole } from 'src/role/user_role.entity';
import { Role } from 'src/role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserRole, Role])],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
