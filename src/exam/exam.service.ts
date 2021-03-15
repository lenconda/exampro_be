import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
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

  async createExam(creator: User, info: Record<string, any>) {
    const basicData = _.pick(info, ['title', 'grades', 'duration']);
    const startTime = info.start_time ? new Date(info.start_time) : null;
    const endTime = info.end_time ? new Date(info.end_time) : null;
    const exam = this.examRepository.create({
      ...basicData,
      startTime,
      endTime,
    });
    await this.examRepository.save(exam);
    const examUser = this.examUserRepository.create({
      exam: {
        id: exam.id,
      },
      user: {
        email: creator.email,
      },
      role: {
        id: 'resource/exam/initiator',
      },
    });
    await this.examUserRepository.save(examUser);
    return exam;
  }

  async createExamPaper(creator: User, examId: number, paperId: number) {
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

  async deleteExams(creator: User, examIds: number[]) {
    const examUsers = await this.examUserRepository.find({
      where: {
        user: {
          email: creator.email,
        },
        exam: {
          id: In(examIds),
        },
        role: {
          id: 'resource/exam/initiator',
        },
      },
      relations: ['exam'],
    });
    const examIdsToBeDeleted = examUsers.map((examUser) => examUser.exam.id);
    await this.examRepository.delete(examIdsToBeDeleted);
    return;
  }
}
