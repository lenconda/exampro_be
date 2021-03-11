import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ERR_MENU_NOT_FOUND,
  ERR_MENU_PARENT_CIRCLED,
  ERR_ROLE_NOT_FOUND,
} from 'src/constants';
import { MenuRole } from 'src/role/menu_role.entity';
import { Role } from 'src/role/role.entity';
import { checkValueMatchPatterns } from 'src/utils/checkers';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository } from 'typeorm';
import { Menu } from './menu.entity';
import _ from 'lodash';

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
          orderColumn: 'menu.id',
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
    parentId,
    roleIds: string[] = [],
  ) {
    let parentMenu = null;

    if (parentId) {
      parentMenu = await this.menuRepository.findOne({
        id: parentId,
      });
      if (!parentMenu) {
        throw new NotFoundException(ERR_MENU_NOT_FOUND);
      }
    }

    const menuItem = this.menuRepository.create({
      title,
      pathname,
      icon,
      parentMenu,
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

  async getMenu(roles: Partial<Role>[]) {
    const items = await this.menuRoleRepository.find({
      where: {
        role: {
          id: In(roles.map((role) => role.id)),
        },
      },
      relations: ['menu', 'menu.parentMenu', 'menu.children'],
    });
    return items
      .filter((item) => !item.menu.parentMenu)
      .map((item) => {
        return _.omit(item.menu, ['parentMenu']);
      });
  }

  async updateMenu(id: number, updates: Record<string, any>) {
    const parentId = updates.parent;
    if (parentId === id) {
      throw new BadRequestException(ERR_MENU_PARENT_CIRCLED);
    }
    const parentUpdates: Partial<Menu> = {};
    if (parentId) {
      const parentMenu = await this.menuRepository.findOne({ id: parentId });
      if (!parentMenu) {
        throw new NotFoundException(ERR_MENU_NOT_FOUND);
      }
      parentUpdates.parentMenu = parentMenu;
    }
    await this.menuRepository.update(
      { id },
      _.merge(
        _.pick(updates, ['title', 'icon', 'pathname', 'show']),
        parentUpdates,
      ),
    );

    return;
  }

  async deleteMenus(ids: number[]) {
    const menus = await this.menuRepository.find({
      where: {
        id: In(ids),
      },
    });
    await this.menuRepository.delete(menus.map((menu) => menu.id));
    return;
  }
}
