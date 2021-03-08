import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/user/user.decorator';
import { MenuService } from './menu.service';

@Controller('/api/menu')
@UseGuards(AuthGuard('jwt'))
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async getMenu(@CurrentUser() user) {
    return await this.menuService.getMenu(user.roles);
  }
}
