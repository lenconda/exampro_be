import { Body, Controller, Param, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('/api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string = null,
  ) {
    return await this.authService.login(email, password);
  }

  @Post('/logout')
  async logout(@Body('redirect') redirect = '') {
    return await this.authService.logout(redirect);
  }

  @Post('/register')
  async register(@Body('email') email: string) {
    return await this.authService.register([email]);
  }

  @Post('/forget_password')
  async forgetPassword(@Body('email') email: string) {
    return await this.authService.forgetPassword(email);
  }

  @Post('/resend/:email/:type')
  async resend(@Param('email') email: string, @Param('type') type: string) {
    return await this.authService.resend(email, type);
  }

  @Post('/check')
  async checkEmail(@Body('email') email: string) {
    return await this.authService.checkEmail(email);
  }
}
