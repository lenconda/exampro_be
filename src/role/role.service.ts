import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { Role } from './role.entity';
import _ from 'lodash';
import { ERR_ROLE_ID_DUPLICATED, ERR_ROLE_NOT_FOUND } from 'src/constants';
import { UserRole } from './user_role.entity';
import { MenuRole } from './menu_role.entity';
import { User } from 'src/user/user.entity';
import { Menu } from 'src/menu/menu.entity';
import { queryWithPagination } from 'src/utils/pagination';

export interface RoleTreeItem {
  id: string;
  originalId: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  children: RoleTreeItem[];
}

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(MenuRole)
    private readonly menuRoleRepository: Repository<MenuRole>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
  ) {}

  async createRole(id: string, description?: string, order = 0) {
    if (await this.roleRepository.findOne({ id })) {
      throw new BadRequestException(ERR_ROLE_NOT_FOUND);
    }
    return await this.roleRepository.save({ id, description, order });
  }

  async getFlattenedRoles() {
    return await this.roleRepository.find();
  }

  async updateRole(id: string, data: Partial<Role>) {
    const updates = _.pick(data, ['description', 'id', 'order']);
    if (updates.id && (await this.roleRepository.findOne({ id: updates.id }))) {
      throw new BadRequestException(ERR_ROLE_ID_DUPLICATED);
    }
    await this.roleRepository.update({ id }, updates);
    return;
  }

  async deleteRoles(id: string) {
    if (!id) {
      return;
    }
    await this.roleRepository.delete({
      id: Like(`${id}%`),
    });
  }

  async grantUserRoles(userEmails: string[], roleIds: string[]) {
    const existedUserRoles = await this.userRoleRepository.find({
      where: {
        user: {
          email: In(userEmails),
        },
        role: {
          id: In(roleIds),
        },
      },
      relations: ['role'],
    });
    const users = await this.userRepository.find({
      where: userEmails.map((email) => ({ email })),
    });
    const roles = await this.roleRepository.find({
      where: roleIds.map((id) => ({ id })),
    });
    const userRoles: UserRole[] = [];
    for (const user of users) {
      for (const role of roles) {
        if (
          !existedUserRoles.find(
            (userRole) =>
              user.email === userRole.user.email &&
              role.id === userRole.role.id,
          )
        ) {
          userRoles.push(this.userRoleRepository.create({ user, role }));
        }
      }
    }
    await this.userRoleRepository.save(userRoles);
    return { items: userRoles };
  }

  async revokeUserRoles(userEmails: string[], roleIds: string[]) {
    const deletes = [];
    for (const email of userEmails) {
      for (const id of roleIds) {
        const userRole = await this.userRoleRepository.findOne({
          where: {
            user: { email },
            role: { id },
          },
        });
        if (userRole) {
          deletes.push(userRole);
        }
      }
    }
    await this.userRoleRepository.delete(deletes);
    return { items: deletes };
  }

  async queryRoleUsers(
    lastCursor: string,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    roleId: string,
    page,
  ) {
    const data = await queryWithPagination<string, UserRole>(
      this.userRoleRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        search,
        cursorColumn: 'user.email',
        searchColumns: ['user.email', 'user.name'],
        query: {
          join: {
            alias: 'items',
            leftJoin: {
              user: 'items.user',
            },
          },
          where: {
            role: {
              id: roleId,
            },
          },
          relations: ['user'],
        },
        page,
      },
    );
    return {
      total: data.total,
      items: data.items.map((item) => item.user),
    };
  }

  async grantMenuRoles(menuIds: number[], roleIds: string[]) {
    const existedMenuRoles = await this.menuRoleRepository.find({
      where: {
        menu: {
          id: In(menuIds),
        },
        role: {
          id: In(roleIds),
        },
      },
      relations: ['menu', 'role'],
    });
    const menus = await this.menuRepository.find({
      where: menuIds.map((id) => ({ id })),
    });
    const roles = await this.roleRepository.find({
      where: roleIds.map((id) => ({ id })),
    });
    const menuRoles: MenuRole[] = [];
    for (const menu of menus) {
      for (const role of roles) {
        if (
          !existedMenuRoles.find(
            (menuRole) =>
              menu.id === menuRole.menu.id && role.id === menuRole.role.id,
          )
        ) {
          menuRoles.push(this.menuRoleRepository.create({ menu, role }));
        }
      }
    }
    await this.menuRoleRepository.save(menuRoles);
    return { items: menuRoles };
  }

  async revokeMenuRoles(menuIds: number[], roleIds: string[]) {
    const deletes = [];
    for (const menuId of menuIds) {
      for (const roleId of roleIds) {
        const menuRole = await this.menuRoleRepository.findOne({
          where: {
            menu: { id: menuId },
            role: { id: roleId },
          },
        });
        if (menuRole) {
          deletes.push(menuRole);
        }
      }
    }
    await this.menuRoleRepository.delete(deletes);
    return { items: deletes };
  }

  async queryRoleMenus(
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    roleId: string,
    page,
  ) {
    const data = await queryWithPagination<number, MenuRole>(
      this.menuRoleRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        search,
        searchColumns: ['menu.pathname', 'menu.title'],
        cursorColumn: 'menu.id',
        query: {
          join: {
            alias: 'items',
            leftJoin: {
              menu: 'items.menu',
            },
          },
          where: {
            role: {
              id: roleId,
            },
          },
          relations: ['menu'],
        },
        page,
      },
    );
    return {
      total: data.total,
      items: data.items.map((item) => item.menu),
    };
  }

  async getResourceRoles(type: string) {
    if (!['exam', 'paper'].includes(type)) {
      return { items: [] };
    }
    const data = await this.roleRepository.find();
    const items = _.orderBy(
      data.filter((item) => item.id.startsWith(`resource/${type}`)),
      ['order'],
      ['asc'],
    );
    return {
      items,
    };
  }
}
