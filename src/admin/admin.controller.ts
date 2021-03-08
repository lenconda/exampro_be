import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenuService } from 'src/menu/menu.service';
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { UserService } from 'src/user/user.service';

@Controller('/api/admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly menuService: MenuService,
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
    @Body('parent') parent: string,
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
}
