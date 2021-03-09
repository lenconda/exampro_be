import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenuService } from 'src/menu/menu.service';
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';

@Controller('/api/admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly menuService: MenuService,
    private readonly roleService: RoleService,
  ) {}

  @Post()
  @Role('user/admin/system', 'user/admin/user')
  async createAdmin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('roles') roles: string[] = [],
  ) {
    return await this.userService.createAdminUser(email, password, roles);
  }

  @Get('/user')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/role')
  async getUserList(
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = -1,
    @Query('order') order = 'asc',
  ) {
    return await this.userService.getUserList<string>(lastCursor, size, order);
  }

  @Get('/user/:email')
  @Role('user/admin/system', 'user/admin/user')
  async getUserProfile(@Param('email') email: string) {
    return await this.userService.getUserProfile(email);
  }

  @Put('/user/:email/block')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/report')
  async blockUser(
    @Param('email') email: string,
    @Body('type') type: string,
    @Body('days') days = -1,
  ) {
    return await this.userService.blockUser(email, type, days);
  }

  @Delete('/user/:email/block')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/report')
  async unblockUser(@Param('email') email: string) {
    return await this.userService.unblockUser(email);
  }

  @Get('/menu')
  @Role('user/admin/system', 'user/admin/layout', 'user/admin/role')
  async queryMenu(
    @Query('last_cursor') lastCursor = 0,
    @Query('size') size = -1,
    @Query('role') roleId: string,
    @Query('order') order: 'asc' | 'desc' = 'asc',
  ) {
    return await this.menuService.queryMenu(lastCursor, size, order, roleId);
  }

  @Post('/menu')
  @Role('user/admin/system', 'user/admin/layout')
  async createMenuItem(
    @Body('title') title: string,
    @Body('pathname') pathname: string,
    @Body('icon') icon: string,
    @Body('parent') parent: number,
    @Body('roles') roles: string[],
  ) {
    return await this.menuService.createMenuItem(
      title,
      pathname,
      icon,
      parent,
      roles,
    );
  }

  @Patch('/menu/:id')
  @Role('user/admin/system', 'user/admin/layout')
  async updateMenu(
    @Body() updates: Record<string, any>,
    @Param('id') id: string,
  ) {
    return await this.menuService.updateMenu(parseInt(id, 10), updates);
  }

  @Delete('/menu')
  @Role('user/admin/system', 'user/admin/layout')
  async deleteMenus(@Body('id') ids: number[]) {
    return await this.menuService.deleteMenus(ids);
  }

  @Delete('/menu/:id')
  @Role('user/admin/system', 'user/admin/layout')
  async deleteOneMenu(@Param('id') id: string) {
    return await this.menuService.deleteMenus([parseInt(id, 10)]);
  }

  @Post('/role')
  @Role('user/admin/system', 'user/admin/role')
  async createRole(
    @Body('id') id: string,
    @Body('description') description: string = null,
  ) {
    return await this.roleService.createRole(id, description);
  }

  @Get('/role')
  @Role('user/admin/system', 'user/admin/role')
  async getRoles(@Query('flatten') flatten = false) {
    if (flatten) {
      return await this.roleService.getFlattenedRoles();
    } else {
      return await this.roleService.getTreedRoles();
    }
  }

  @Post('/role/user')
  @Role('user/admin/system', 'user/admin/role')
  async grantUserRoles(
    @Body('users') userEmails: string[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.grantUserRoles(userEmails, roleIds);
  }

  @Delete('/role/user')
  @Role('user/admin/system', 'user/admin/role')
  async revokeUserRoles(
    @Body('users') userEmails: string[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.revokeUserRoles(userEmails, roleIds);
  }

  @Post('/role/menu')
  @Role('user/admin/system', 'user/admin/role')
  async grantMenuRoles(
    @Body('menus') menuIds: number[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.grantMenuRoles(menuIds, roleIds);
  }

  @Delete('/role/menu')
  @Role('user/admin/system', 'user/admin/role')
  async revokeMenuRoles(
    @Body('menus') menuIds: number[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.revokeMenuRoles(menuIds, roleIds);
  }

  @Patch('/role/:id')
  @Role('user/admin/system', 'user/admin/role')
  async updateRole(@Param('id') id: string, @Body() updates = {}) {
    return await this.roleService.updateRole(id, updates);
  }

  @Delete('/role/:id')
  @Role('user/admin/system', 'user/admin/role')
  async deleteRole(@Param('id') id: string) {
    return await this.roleService.deleteRoles([id]);
  }

  @Delete('/role')
  @Role('user/admin/system', 'user/admin/role')
  async deleteRoles(@Body('id') ids: string[] = []) {
    return await this.roleService.deleteRoles(ids);
  }
}
