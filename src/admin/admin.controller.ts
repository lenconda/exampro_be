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
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { UserService } from 'src/user/user.service';

@Controller('/api/admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class AdminController {
  constructor(private readonly userService: UserService) {}

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
  @Role('user/admin/system', 'user/admin/user', 'user/admin/role')
  async getUserProfile(@Param('email') email: string) {
    return await this.userService.getUserProfile(email);
  }

  @Put('/user/:email/block')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/role')
  async blockUser(
    @Param('email') email: string,
    @Body('type') type: string,
    @Body('days') days = -1,
  ) {
    return await this.userService.blockUser(email, type, days);
  }

  @Delete('/user/:email/block')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/role')
  async unblockUser(@Param('email') email: string) {
    return await this.userService.unblockUser(email);
  }
}
