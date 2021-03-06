import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { UserService } from 'src/user/user.service';
import { AdminService } from './admin.service';

@Controller('/api/admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly userService: UserService,
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
    return await this.adminService.getUserList<string>(lastCursor, size, order);
  }
}
