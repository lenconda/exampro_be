import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MenuRole } from 'src/role/menu_role.entity';
import { Role } from 'src/role/role.entity';
import { checkValueMatchPatterns } from 'src/utils/checkers';
import { Repository } from 'typeorm';
import { Menu } from './menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(MenuRole)
    private readonly menuRoleRepository: Repository<MenuRole>,
  ) {}

  async createMenuItem(
    title: string,
    pathname: string,
    icon = '',
    parentMenuPathname = '',
    roleIds: string[] = [],
  ) {
    const parent = await this.menuRepository.findOne({
      pathname: parentMenuPathname,
    });
    const menuItem = this.menuRepository.create({
      title,
      pathname,
      icon,
      parentMenu: parent || null,
    });
    await this.menuRepository.save(menuItem);
    const roles = (await this.roleRepository.find()).filter((role) =>
      checkValueMatchPatterns(role.id, roleIds),
    );
    const menuRoles = roles.map((role) =>
      this.menuRoleRepository.create({
        role,
        menu: menuItem,
      }),
    );
    await this.menuRoleRepository.save(menuRoles);
    return menuItem;
  }
}
