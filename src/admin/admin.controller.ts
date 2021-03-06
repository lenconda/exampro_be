import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { AdminService } from './admin.service';

@Controller('/api/admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('/user')
  @Role('user/admin/system', 'user/admin/user')
  async createAdmin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('roles') roles: string[] = [],
  ) {
    return await this.adminService.addAdminUser(email, password, roles);
  }
}
