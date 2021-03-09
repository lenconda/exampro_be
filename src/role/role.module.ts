import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from 'src/menu/menu.entity';
import { User } from 'src/user/user.entity';
import { MenuRole } from './menu_role.entity';
import { Role } from './role.entity';
import { RoleService } from './role.service';
import { UserRole } from './user_role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Role, UserRole, MenuRole, User, Menu])],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
