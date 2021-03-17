import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamResult } from './exam_result.entity';
import { ExamUser } from './exam_user.entity';

export type QuestionAnswer = Record<string, string[]>;

@Injectable()
export class ExamResultService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamUser)
    private readonly examUserRepository: Repository<ExamUser>,
    @InjectRepository(PaperUser)
    private readonly paperUserRepository: Repository<PaperUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ExamResult)
    private readonly examResultRepository: Repository<ExamResult>,
  ) {}

  async createExamAnswer(examId: number, questionAnswer: QuestionAnswer) {
    const exam = await this.examRepository.findOne({ id: examId });
    const currentTimestamp = Date.now();
    const endTimestamp = exam.endTime.getTime();
    if (currentTimestamp > endTimestamp) {
      throw new ForbiddenException();
    }
    const { startTime, delay } = exam;
    if (startTime && currentTimestamp < startTime.getTime() + delay) {
      throw new ForbiddenException();
    }
    const examResults = _.flatten(
      Object.keys(questionAnswer).map((key) => {
        const questionId = parseInt(key);
        const contents = Array.from(questionAnswer[key]);
        const currentExamResults = contents.map((content) => {
          return this.examResultRepository.create({
            question: {
              id: questionId,
            },
            content,
            exam: {
              id: examId,
            },
          });
        });
        return currentExamResults;
      }),
    );
    await this.examResultRepository.save(examResults);
  }
}
