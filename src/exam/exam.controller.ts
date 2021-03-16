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
import { User } from 'src/user/user.entity';
import { Exam } from './exam.entity';
import { ExamService } from './exam.service';

@Controller('/api/exam')
@UseGuards(AuthGuard('jwt'))
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post('/paper')
  async createExamPaper(
    @CurrentUser() user: User,
    @Body('exam') examId: number,
    @Body('paper') paperId: number,
  ) {
    return await this.examService.createExamPaper(user, examId, paperId);
  }

  @Patch('/:exam/owner')
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
  async createExamMaintainers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(examId, emails, 'maintainer');
  }

  @Post('/:exam/invigilator')
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
  async createExamReviewers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(examId, emails, 'reviewer');
  }

  @Post('/:exam/participant')
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
  async deleteExamMaintainers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.deleteExamUsers(examId, emails, 'maintainer');
  }

  @Delete('/:exam/invigilator')
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
  async deleteExamReviewers(
    @Param('exam') examId: number,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.deleteExamUsers(examId, emails, 'reviewer');
  }

  @Delete('/:exam/participant')
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
  async queryExamUsers(
    @Param('exam') examId: number,
    @Param('type') type: string,
    @Query('last_cursor') lastCursor = '',
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
    );
  }

  @Patch('/:exam')
  async updateExam(
    @CurrentUser() user: User,
    @Param('exam') examId: number,
    @Body() updates: Record<string, any>,
  ) {
    return await this.examService.updateExam(user, examId, updates);
  }

  @Post()
  async createExam(@CurrentUser() user: User, @Body() info: Partial<Exam>) {
    return await this.examService.createExam(user, info);
  }

  @Delete()
  async deleteExams(
    @CurrentUser() user: User,
    @Body('exams') examIds: number[],
  ) {
    return await this.examService.deleteExams(user, examIds);
  }

  @Get()
  async getPapers(
    @CurrentUser() user,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('role') roleId = 'resource/exam/participant',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.examService.queryExams(
      user,
      cursor,
      parseInt(size),
      order,
      search,
      roleId,
    );
  }
}
