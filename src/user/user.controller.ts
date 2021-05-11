import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from './user.decorator';
import { User } from './user.entity';
import { UserService } from './user.service';

@Controller('/api/user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
  ) {}

  @Get('/profile')
  async getProfile(@CurrentUser() user: User) {
    return await this.userService.getUserProfile(user.email);
  }

  @Get('/profile/:email')
  async getUserProfileDetail(@Param('email') email: string) {
    return await this.userRepository.findOne({ email });
  }

  @Get('/list')
  async queryUsers(
    @Query('last_cursor') lastCursor = '',
    @Query('search') search = '',
    @Query('size') size = '-1',
    @Query('order') order = 'asc',
    @Query('page') page = '0',
  ) {
    return await this.userService.queryUsers<string>(
      lastCursor,
      parseInt(size),
      order,
      search,
      parseInt(page),
    );
  }

  @Patch('/profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updates: Partial<User> = {},
  ) {
    return await this.userService.updateUserProfile(user.email, updates);
  }

  @Patch('/password')
  async updateUserPassword(
    @CurrentUser() user: User,
    @Body('old') oldPassword: string,
    @Body('new') newPassword: string,
  ) {
    return await this.userService.updateUserPassword(
      user,
      oldPassword,
      newPassword,
    );
  }

  @Post('/change_email')
  async changeEmail(
    @CurrentUser() user: User,
    @Body('email') newEmail: string,
  ) {
    return await this.userService.changeEmail(user.email, newEmail);
  }

  @Post('/complete/registration')
  async completeRegistration(
    @CurrentUser() user: User,
    @Body('name') name = '',
    @Body('password') password = '',
  ) {
    return await this.userService.completeRegistration(
      user.email,
      name,
      password,
    );
  }

  @Post('/complete/forget_password')
  async completeForgetPassword(
    @CurrentUser() user: User,
    @Body('password') password = '',
  ) {
    return await this.userService.completeForgetPassword(user.email, password);
  }

  @Post('/complete/change_email')
  async completeChangeEmail(@CurrentUser() user: User) {
    return await this.userService.completeChangeEmail(user.email);
  }

  @Delete()
  async destroy(@CurrentUser() user: User) {
    return await this.userService.destroy(user.email);
  }
}
