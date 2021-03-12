import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './user.decorator';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('/api/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  async getProfile(@CurrentUser() user: User) {
    return user;
  }

  @Get('/list')
  async queryUsers(
    @Query('last_cursor') lastCursor = '',
    @Query('search') search = '',
    @Query('size') size = '-1',
    @Query('order') order = 'asc',
  ) {
    return await this.userService.queryUsers<string>(
      lastCursor,
      parseInt(size),
      order,
      search,
    );
  }

  @Patch('/profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updates: Partial<User> = {},
  ) {
    return await this.userService.updateUserProfile(user.email, updates);
  }

  @Post('/change_email')
  async changeEmail(
    @CurrentUser() user: User,
    @Body('email') newEmail: string,
  ) {
    return await this.userService.changeEmail(user.email, newEmail);
  }

  @Delete()
  async destroy(@CurrentUser() user: User) {
    return await this.userService.destroy(user.email);
  }
}
