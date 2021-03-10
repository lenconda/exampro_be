import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaperService } from './paper.service';

@Controller('/api/paper')
@UseGuards(AuthGuard('jwt'))
export class PaperController {
  constructor(private readonly paperService: PaperService) {}

  @Get('/:paper')
  async getPaper(@Param('paper') paperId: string) {
    return await this.paperService.getPaper(parseInt(paperId));
  }
}
