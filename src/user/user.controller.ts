import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from './user.decorator';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('/api/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/profile')
  async profile(@CurrentUser() user: Record<string, any>) {
    return user;
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
