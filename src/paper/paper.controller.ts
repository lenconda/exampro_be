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

  @Post('/:paper/questions')
  async createPaperQuestion(
    @Param('paper') paperId: number,
    @Body('question') questionId: number,
    @Body('order') order: number,
  ) {
    return await this.paperService.createPaperQuestion(
      paperId,
      questionId,
      order,
    );
  }

  @Delete('/:paper/questions')
  async deletePaperQuestions(
    @Param('paper') paperId: number,
    @Body('questions') questionIds: number[],
  ) {
    return await this.paperService.deletePaperQuestions(paperId, questionIds);
  }

  @Get('/:paper/questions')
  async getPaperQuestions(@Param('paper') paperId: number) {
    return await this.paperService.getPaperQuestions(paperId, false);
  }

  @Get('/:paper/questions_answers')
  async getPaperQuestionsWithAnswers(@Param('paper') paperId: number) {
    return await this.paperService.getPaperQuestions(paperId, true);
  }

  @Post('/:paper/maintainers')
  async createPaperMaintainers(
    @Param('paper') paperId: number,
    @Body('emails') maintainerEmails: string[] = [],
  ) {
    return this.paperService.createPaperMaintainers(paperId, maintainerEmails);
  }

  @Delete('/:paper/maintainers')
  async deletePaperMaintainers(
    @Param('paper') paperId: number,
    @Body('emails') maintainerEmails: string[] = [],
  ) {
    return this.paperService.deletePaperMaintainers(paperId, maintainerEmails);
  }

  @Get('/:paper/maintainers')
  async getPaperMaintainers(
    @Param('paper') paperId: number,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    return this.paperService.getPaperMaintainers(
      paperId,
      parseInt(lastCursor),
      parseInt(size),
      order,
    );
  }

  @Patch('/:paper/owner')
  async transformOwnership(
    @Param('paper') paperId: number,
    @CurrentUser() user,
    @Body('email') newEmail: string,
  ) {
    return await this.paperService.transformOwnership(
      paperId,
      user.email,
      newEmail,
    );
  }

  @Delete('/:paper')
  async deletePaper(@CurrentUser() user, @Param('paper') paperId: number) {
    return await this.paperService.deletePapers(user, [paperId]);
  }

  @Get('/:paper')
  async getPaper(@CurrentUser() user, @Param('paper') paperId: string) {
    return await this.paperService.getPaper(user, parseInt(paperId));
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
