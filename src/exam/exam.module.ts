import { Module } from '@nestjs/common';
import { ExamService } from './exam.service';
import { ExamController } from './exam.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './exam.entity';
import { ExamUser } from './exam_user.entity';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, ExamUser, PaperUser, User])],
  providers: [ExamService],
  controllers: [ExamController],
  exports: [ExamService],
})
export class ExamModule {}
