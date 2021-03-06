import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './user.decorator';

@Controller('/api/user')
export class UserController {
  @Get('profile')
  async profile(@CurrentUser() user: Record<string, any>) {
    return user;
  }
}
