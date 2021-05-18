import { Controller, Get, Param } from '@nestjs/common';
import { DynamicService } from './dynamic.service';

@Controller('/api/dynamic')
export class DynamicController {
  constructor(private readonly dynamicService: DynamicService) {}

  @Get('/:pathname')
  async getDynamicContent(@Param('pathname') pathname: string) {
    return await this.dynamicService.getDynamicConfigDetail(pathname);
  }
}
