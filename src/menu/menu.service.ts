import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ERR_MENU_NOT_FOUND, ERR_MENU_PARENT_CIRCLED } from 'src/constants';
import { MenuRole } from 'src/role/menu_role.entity';
import { Role } from 'src/role/role.entity';
import { checkValueMatchPatterns } from 'src/utils/checkers';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
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
    page,
  ) {
    const queryOrder = order.toUpperCase() as 'ASC' | 'DESC';
    const result = await queryWithPagination<number, Menu>(
      this.menuRepository,
      lastCursor,
      queryOrder,
      size,
      {
        cursorColumn: 'menus.id',
        orderColumn: 'order',
        searchWithAlias: true,
        query: {
          join: {
            alias: 'menus',
            leftJoin: {
              roles: 'menus.menuRoles',
            },
          },
          where: roleId
            ? (qb: SelectQueryBuilder<Menu>) => {
                qb.andWhere('roles.role.id = :roleId', {
                  roleId,
                });
                return '';
              }
            : {},
          relations: ['parentMenu'],
        },
        page,
      },
    );

    const { items = [], total = 0 } = result;

    return {
      items,
      total,
    };
  }

  async createMenuItem(
    title: string,
    pathname: string,
    icon = '',
    parentId,
    order: number,
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
      order,
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
    const items = await this.menuRepository.find({
      join: {
        alias: 'menus',
        leftJoin: {
          roles: 'menus.menuRoles',
          children: 'menus.children',
        },
      },
      where: (qb: SelectQueryBuilder<Menu>) => {
        qb.where('roles.role.id IN (:roleIds)', {
          roleIds: roles.map((role) => role.id),
        });
        return '';
      },
      relations: ['parentMenu', 'children'],
    });
    const sort = (items: Menu[]): Array<Menu & { items: Menu[] }> => {
      const result = [];
      const sortedItems = _.sortBy(items, (item) => item.order, ['asc']);
      for (const item of sortedItems) {
        const currentInfo = _.omit(item, ['parentMenu', 'children']) as Record<
          string,
          any
        >;
        const currentChildren = item.children || [];
        if (currentChildren.length !== 0) {
          currentInfo.items = sort(currentChildren);
        }
        result.push(currentInfo);
      }
      return result;
    };
    return sort(items.filter((item) => !item.parentMenu));
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
        _.pick(updates, ['title', 'icon', 'pathname', 'show', 'order']),
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
