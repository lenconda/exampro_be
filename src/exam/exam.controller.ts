import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
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
}
