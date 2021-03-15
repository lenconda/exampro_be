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

  @Post('/:exam/:type')
  async createExamUsers(
    @Param('exam') examId: number,
    @Param('type') type: string,
    @Body('emails') emails: string[],
  ) {
    return await this.examService.createExamUsers(examId, emails, type);
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
    @Query('roles') roles = 'resource/exam/initiator,resource/exam/maintainer',
  ) {
    const roleIds = roles ? roles.split(',') : [];
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.examService.queryExams(
      user,
      cursor,
      parseInt(size),
      order,
      search,
      roleIds,
    );
  }
}
