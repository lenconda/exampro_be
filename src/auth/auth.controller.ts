import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.authService.login(email, password);
  }

  @Post('/register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return await this.authService.register(email, password);
  }

  @Get('/active')
  async active(@Query('email') email: string, @Query('code') code: string) {
    return await this.authService.active(email, code);
  }

  @Post('/forget_password')
  async forgetPassword(@Body('email') email: string) {
    return await this.authService.forgetPassword(email);
  }

  @Post('/reset_password')
  async resetPassword(
    @Body('email') email: string,
    @Body('code') code: string,
    @Body('password') password: string,
  ) {
    return await this.authService.resetPassword(email, code, password);
  }
}
