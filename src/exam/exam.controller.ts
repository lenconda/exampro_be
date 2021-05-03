import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { RoleService } from 'src/role/role.service';
import { CurrentUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.entity';
import { Exam } from './exam.entity';
import { ExamService } from './exam.service';
import {
  ExamResultService,
  QuestionAnswer,
  QuestionScore,
} from './exam_result.service';

@Controller('/api/exam')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly examResultService: ExamResultService,
    private readonly roleService: RoleService,
  ) {}

  @Get('/roles')
  async getExamRoles() {
    return await this.roleService.getResourceRoles('exam');
  }

  @Post('/:exam/paper')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async createExamPaper(
    @CurrentUser() user: User,
    @Param('exam') examId: number,
    @Body('paper') paperId: number,
  ) {
    return await this.examService.createExamPaper(user, examId, paperId);
  }

  @Post('/:exam/result')
  @Role('resource/exam/participant')
  async createExamAnswer(
    @CurrentUser() user: User,
    @Param('exam') examId: number,
    @Body('answer') answer: QuestionAnswer,
  ) {
    return await this.examResultService.createExamAnswer(user, examId, answer);
  }

  @Get('/:exam/result')
  @Role('resource/exam/participant')
  async getExamResult(
    @CurrentUser() user: User,
    @Param('exam') examId: number,
  ) {
    return await this.examResultService.getParticipantExamResult(
      examId,
      user.email,
    );
  }

  @Get('/:exam/results')
  @Role(
    'resource/exam/initiator',
    'resource/exam/maintainer',
    'resource/exam/reviewer',
  )
  async getExamResults(@Param('exam') examId: number) {
    return await this.examResultService.getScoresList(examId);
  }

  @Get('/:exam/result/:email')
  @Role(
    'resource/exam/initiator',
    'resource/exam/maintainer',
    'resource/exam/reviewer',
  )
  async getParticipantExamResult(
    @Param('exam') examId: number,
    @Param('email') email: string,
  ) {
    return await this.examResultService.getParticipantExamResult(examId, email);
  }

  @Put('/:exam/score/:email')
  @Role('resource/exam/reviewer')
  async putParticipantExamScores(
    @Param('exam') examId: number,
    @Param('email') email: string,
    @Body('score') score: QuestionScore,
  ) {
    return await this.examResultService.putScores(examId, email, score);
  }

  @Patch('/:exam/confirm')
  async confirmExam(
    @CurrentUser() user: User,
    @Param('exam') examId: number,
    @Body('confirm') confirm: boolean = null,
  ) {
    return await this.examService.confirmExam(user, examId, confirm);
  }

  @Patch('/:exam/initiator')
  @Role('resource/exam/initiator')
  async transformOwnership(
    @Param('exam') examId: number,
    @CurrentUser() user,
    @Body('email') newEmail: string,
  ) {
    return await this.examService.transformOwnership(
      examId,
      user.email,
      newEmail,
    );
  }

  @Post('/:exam/maintainer')
  @Role('resource/exam/initiator')
  async createExamMaintainers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(examId, emails, 'maintainer');
  }

  @Post('/:exam/invigilator')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async createExamInvigilators(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(
      examId,
      emails,
      'invigilator',
    );
  }

  @Post('/:exam/reviewer')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async createExamReviewers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(examId, emails, 'reviewer');
  }

  @Post('/:exam/participant')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async createExamParticipants(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(
      examId,
      emails,
      'participant',
    );
  }

  @Delete('/:exam/maintainer')
  @Role('resource/exam/initiator')
  async deleteExamMaintainers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.deleteExamUsers(examId, emails, 'maintainer');
  }

  @Delete('/:exam/invigilator')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async deleteExamInvigilators(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.deleteExamUsers(
      examId,
      emails,
      'invigilator',
    );
  }

  @Delete('/:exam/reviewer')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async deleteExamReviewers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.deleteExamUsers(examId, emails, 'reviewer');
  }

  @Delete('/:exam/participant')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async deleteExamParticipants(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.deleteExamUsers(
      examId,
      emails,
      'participant',
    );
  }

  @Get('/:exam/:type')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async queryExamUsers(
    @Param('exam') examId: number,
    @Param('type') type: string,
    @Query('last_cursor') lastCursor = '',
    @Query('page') page = '0',
    @Query('size') size = 10,
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.examService.queryExamUsers(
      examId,
      cursor,
      size,
      search,
      order,
      type,
      parseInt(page),
    );
  }

  @Patch('/:exam')
  @Role('resource/exam/initiator', 'resource/exam/maintainer')
  async updateExam(
    @CurrentUser() user: User,
    @Param('exam') examId: number,
    @Body() updates: Record<string, any>,
  ) {
    return await this.examService.updateExam(user, examId, updates);
  }

  @Get('/:exam')
  @Role(
    'resource/exam/initiator',
    'resource/exam/maintainer',
    'resource/exam/reviewer',
    'resource/exam/participant',
  )
  async getExam(@CurrentUser() user: User, @Param('exam') examId: number) {
    return await this.examService.getExam(user, examId);
  }

  @Post()
  async createExam(@CurrentUser() user: User, @Body() info: Partial<Exam>) {
    return await this.examService.createExam(user, info);
  }

  @Delete()
  @Role('resource/exam/initiator')
  async deleteExams(
    @CurrentUser() user: User,
    @Body('exams') examIds: number[],
  ) {
    return await this.examService.deleteExams(user, examIds);
  }

  @Get()
  async queryExams(
    @CurrentUser() user,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('roles')
    roles = 'resource/exam/participant,resource/exam/reviewer,resource/exam/invigilator,resource/exam/initiator,resource/exam/maintainer',
    @Query('page') page = '0',
  ) {
    const roleIds = roles ? roles.split(',') : [];
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.examService.queryExams(
      cursor,
      parseInt(size),
      order,
      search,
      roleIds,
      parseInt(page),
      user,
    );
  }

  @Put('/:exam/left_times')
  @Role('resource/exam/participant')
  async updateParticipantLeftTimes(
    @CurrentUser() participant: User,
    @Param('exam') examId: number,
  ) {
    return await this.examService.updateParticipantLeftTimes(
      participant,
      examId,
    );
  }
}
