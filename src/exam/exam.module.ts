import { Global, Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './exam.entity';
import { ExamUser } from './exam_user.entity';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';
import { ExamResult } from './exam_result.entity';
import { ExamResultService } from './exam_result.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamUser, PaperUser, User, ExamResult]),
  ],
  providers: [ExamService, ExamResultService],
  controllers: [ExamController],
  exports: [ExamService, ExamResultService],
})
export class ExamModule {}
