import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from './menu.entity';
import { MenuRole } from 'src/role/menu_role.entity';
import { Role } from 'src/role/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, MenuRole, Role])],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}
