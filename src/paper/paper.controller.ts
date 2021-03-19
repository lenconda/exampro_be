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
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { CurrentUser } from 'src/user/user.decorator';
import { PaperService } from './paper.service';

@Controller('/api/paper')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class PaperController {
  constructor(private readonly paperService: PaperService) {}

  @Get()
  async queryPapers(
    @CurrentUser() user,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('roles') roles = 'resource/paper/owner,resource/paper/maintainer',
  ) {
    const roleIds = roles ? roles.split(',') : [];
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.paperService.queryPapers(
      cursor,
      parseInt(size),
      order,
      search,
      roleIds,
      user,
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
  @Role('resource/paper/owner')
  async deletePapers(@CurrentUser() user, @Body('papers') paperIds: string[]) {
    return this.paperService.deletePapers(
      user,
      paperIds.map((paperId) => parseInt(paperId)),
    );
  }

  @Post('/:paper/questions')
  @Role('resource/paper/owner', 'resource/paper/maintainer')
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
  @Role('resource/paper/owner', 'resource/paper/maintainer')
  async deletePaperQuestions(
    @Param('paper') paperId: number,
    @Body('questions') questionIds: number[],
  ) {
    return await this.paperService.deletePaperQuestions(paperId, questionIds);
  }

  @Get('/:paper/questions')
  @Role(
    'resource/paper/owner',
    'resource/paper/maintainer',
    'resource/exam/initiator',
    'resource/exam/maintainer',
    'resource/exam/reviewer',
    'resource/exam/participant',
  )
  async getPaperQuestions(@Param('paper') paperId: number) {
    return await this.paperService.getPaperQuestions(paperId, false);
  }

  @Get('/:paper/questions_answers')
  @Role(
    'resource/paper/owner',
    'resource/paper/maintainer',
    'resource/exam/initiator',
    'resource/exam/maintainer',
    'resource/exam/reviewer',
  )
  async getPaperQuestionsWithAnswers(@Param('paper') paperId: number) {
    return await this.paperService.getPaperQuestions(paperId, true);
  }

  @Post('/:paper/maintainers')
  @Role('resource/paper/owner')
  async createPaperMaintainers(
    @Param('paper') paperId: number,
    @Body('emails') maintainerEmails: string[] = [],
  ) {
    return this.paperService.createPaperMaintainers(paperId, maintainerEmails);
  }

  @Delete('/:paper/maintainers')
  @Role('resource/paper/owner')
  async deletePaperMaintainers(
    @Param('paper') paperId: number,
    @Body('emails') maintainerEmails: string[] = [],
  ) {
    return this.paperService.deletePaperMaintainers(paperId, maintainerEmails);
  }

  @Get('/:paper/maintainers')
  @Role('resource/paper/owner', 'resource/paper/maintainer')
  async getPaperMaintainers(
    @Param('paper') paperId: number,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return this.paperService.queryPaperMaintainers(
      paperId,
      cursor,
      parseInt(size),
      search,
      order,
    );
  }

  @Patch('/:paper/owner')
  @Role('resource/paper/owner')
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
  @Role('resource/paper/owner')
  async deletePaper(@CurrentUser() user, @Param('paper') paperId: number) {
    return await this.paperService.deletePapers(user, [paperId]);
  }

  @Get('/:paper')
  @Role(
    'resource/paper/owner',
    'resource/paper/maintainer',
    'resource/exam/initiator',
    'resource/exam/maintainer',
    'resource/exam/reviewer',
    'resource/exam/participant',
  )
  async getPaper(@CurrentUser() user, @Param('paper') paperId: string) {
    return await this.paperService.getPaper(user, parseInt(paperId));
  }

  @Patch('/:paper')
  @Role('resource/paper/owner', 'resource/paper/maintainer')
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
