import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/user/user.decorator';
import { PaperService } from './paper.service';

@Controller('/api/paper')
@UseGuards(AuthGuard('jwt'))
export class PaperController {
  constructor(private readonly paperService: PaperService) {}

  @Post()
  async createPaper(
    @CurrentUser() user,
    @Body('title') title: string,
    @Body('public') isPublic = false,
  ) {
    return await this.paperService.createPaper(user, title, isPublic);
  }

  @Delete()
  async deletePapers(@CurrentUser() user, @Body('papers') paperIds: string[]) {
    return this.paperService.deletePapers(
      user,
      paperIds.map((paperId) => parseInt(paperId)),
    );
  }

  @Delete('/:paper')
  async deletePaper(@CurrentUser() user, @Param('paper') paperId: string) {
    return await this.paperService.deletePapers(user, [parseInt(paperId)]);
  }

  @Get('/:paper')
  async getPaper(@Param('paper') paperId: string) {
    return await this.paperService.getPaper(parseInt(paperId));
  }
}
