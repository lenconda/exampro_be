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
import { CurrentUser } from 'src/user/user.decorator';
import { PaperService } from './paper.service';

@Controller('/api/paper')
@UseGuards(AuthGuard('jwt'))
export class PaperController {
  constructor(private readonly paperService: PaperService) {}

  @Get()
  async getPapers(
    @CurrentUser() user,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('roles') roles = 'resource/paper/owner,resource/paper/maintainer',
  ) {
    const roleIds = roles ? roles.split(',') : [];
    return await this.paperService.getPapers(
      user,
      parseInt(lastCursor),
      parseInt(size),
      order,
      roleIds,
    );
  }

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

  @Patch('/:paper')
  async updatePaper(
    @CurrentUser() user,
    @Param('paper') paperId: string,
    @Body() updates: Record<string, any>,
  ) {
    return await this.paperService.updatePaper(
      user,
      parseInt(paperId),
      updates,
    );
  }
}
