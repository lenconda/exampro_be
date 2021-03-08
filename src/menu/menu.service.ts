import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERR_ROLE_NOT_FOUND } from 'src/constants';
import { MenuRole } from 'src/role/menu_role.entity';
import { Role } from 'src/role/role.entity';
import { checkValueMatchPatterns } from 'src/utils/checkers';
import { queryWithPagination } from 'src/utils/pagination';
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

  async queryMenu(
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    roleId = '',
  ) {
    const queryOrder = order.toUpperCase() as 'ASC' | 'DESC';
    if (roleId) {
      const role = await this.roleRepository.findOne({ id: roleId });
      if (!role) {
        throw new NotFoundException(ERR_ROLE_NOT_FOUND);
      }
      const result = await queryWithPagination<number, MenuRole>(
        this.menuRoleRepository,
        lastCursor,
        queryOrder,
        size,
        {
          cursorColumn: 'menu.id',
          query: {
            where: { role },
            relations: ['menu'],
          },
        },
      );
      return {
        items: result.items.map((item) => item.menu),
        total: result.total || 0,
      };
    } else {
      return queryWithPagination<number, Menu>(
        this.menuRepository,
        lastCursor,
        queryOrder,
        size,
        {
          cursorColumn: 'id',
        },
      );
    }
  }

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
