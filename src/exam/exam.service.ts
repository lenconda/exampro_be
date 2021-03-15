import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamUser } from './exam_user.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamUser)
    private readonly examUserRepository: Repository<ExamUser>,
    @InjectRepository(PaperUser)
    private readonly paperUserRepository: Repository<PaperUser>,
  ) {}

  async createExam(creator: User, info: Partial<Exam>) {
    const basicData = _.pick(info, ['title', 'grades', 'duration']);
    const startTime = info.startTime ? new Date(info.startTime) : null;
    const endTime = info.endTime ? new Date(info.endTime) : null;
    const exam = this.examRepository.create({
      ...basicData,
      startTime,
      endTime,
    });
    await this.examRepository.save(exam);
    const examUser = this.examUserRepository.create({
      exam,
      user: {
        email: creator.email,
      },
      role: {
        id: 'resource/exam/owner',
      },
    });
    await this.examUserRepository.save(examUser);
    return exam;
  }

  async createExamPaper(creator: User, examId: number, paperId: number[]) {
    const paperUser = await this.paperUserRepository.findOne({
      where: {
        paper: {
          id: paperId,
        },
        user: {
          email: creator.email,
        },
      },
      relations: ['paper'],
    });
    const exam = await this.examRepository.findOne({
      where: { id: examId },
    });
    if (paperUser && exam) {
      await this.examRepository.update(
        { id: examId },
        {
          paper: paperUser.paper,
        },
      );
    }
  }
}
