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
import { RoleService } from 'src/role/role.service';
import { CurrentUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.entity';
import { PaperService, QuestionData } from './paper.service';

@Controller('/api/paper')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class PaperController {
  constructor(
    private readonly paperService: PaperService,
    private readonly roleService: RoleService,
  ) {}

  @Get()
  async queryPapers(
    @CurrentUser() user,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('roles') roles = 'resource/paper/owner,resource/paper/maintainer',
    @Query('page') page = '0',
  ) {
    const roleIds = roles ? roles.split(',') : [];
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.paperService.queryPapers(
      cursor,
      parseInt(size),
      order,
      search,
      roleIds,
      parseInt(page),
      user,
    );
  }

  @Get('/roles')
  async getExamRoles() {
    return await this.roleService.getResourceRoles('paper');
  }

  @Post()
  async createPaper(
    @CurrentUser() user,
    @Body('title') title: string,
    @Body('public') isPublic = false,
    @Body('missedChoicesScore') missedChoicesScore: number,
  ) {
    return await this.paperService.createPaper(
      user,
      title,
      isPublic,
      missedChoicesScore,
    );
  }

  @Delete()
  @Role('resource/paper/owner')
  async deletePapers(@CurrentUser() user, @Body('papers') paperIds: number[]) {
    return this.paperService.deletePapers(user, paperIds);
  }

  @Post('/:paper/questions')
  @Role('resource/paper/owner', 'resource/paper/maintainer')
  async createPaperQuestion(
    @Param('paper') paperId: number,
    @Body('data') data: QuestionData[],
  ) {
    return await this.paperService.createPaperQuestion(paperId, data);
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
    'resource/exam/participant',
  )
  async getPaperQuestionsWithAnswers(@Param('paper') paperId: number) {
    return await this.paperService.getPaperQuestions(paperId, true);
  }

  @Post('/:paper/maintainers')
  @Role('resource/paper/owner')
  async createPaperMaintainers(
    @Param('paper') paperId: number,
    @CurrentUser() user: User,
    @Body('emails') maintainerEmails: string[] = [],
  ) {
    return this.paperService.createPaperMaintainers(
      user,
      paperId,
      maintainerEmails,
    );
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
    @Query('page') page = '0',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return this.paperService.queryPaperMaintainers(
      paperId,
      cursor,
      parseInt(size),
      search,
      order,
      parseInt(page),
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
