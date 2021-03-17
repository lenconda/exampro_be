import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { User } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamResult } from './exam_result.entity';

export type QuestionAnswer = Record<string, string[]>;
export type QuestionScore = Record<string, number>;

@Injectable()
export class ExamResultService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamResult)
    private readonly examResultRepository: Repository<ExamResult>,
  ) {}

  async createExamAnswer(
    participant: User,
    examId: number,
    questionAnswer: QuestionAnswer,
  ) {
    const existedExamResults = await this.examResultRepository.find({
      where: {
        participant: {
          email: participant.email,
        },
        exam: {
          id: examId,
        },
      },
    });
    if (existedExamResults.length > 0) {
      return;
    }
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
            paperQuestion: {
              question: {
                id: questionId,
              },
            },
            content,
            exam: {
              id: examId,
            },
            participant: {
              email: participant.email,
            },
          });
        });
        return currentExamResults;
      }),
    );
    await this.examResultRepository.save(examResults);
  }

  async getParticipantExamResult(examId: number, email: string) {
    const items = await this.examResultRepository.find({
      where: {
        exam: {
          id: examId,
        },
        participant: {
          email,
        },
      },
      relations: ['exam', 'participant', 'question'],
    });
    return items.reduce((result, currentItem) => {
      const currentQuestionId = currentItem.paperQuestion.question.id.toString();
      if (!result[currentQuestionId]) {
        result[currentQuestionId] = {
          answer: [],
          scores: currentItem.score,
        };
      }
      if (!_.isArray(result[currentQuestionId].answer)) {
        result[currentQuestionId].answer = [];
      }
      if (!result[currentQuestionId].scores) {
        result[currentQuestionId].scores = currentItem.score;
      }
      result[currentQuestionId].answer.push(currentItem.content);
      return result;
    }, {});
  }

  async putScores(examId: number, email: string, score: QuestionScore) {
    const items = await this.examResultRepository.find({
      where: {
        exam: {
          id: examId,
        },
        participant: {
          email,
        },
        question: {
          id: In(Object.keys(score).map((score) => parseInt(score))),
        },
      },
    });
    for (const item of items) {
      let currentScore = score[item.paperQuestion.question.id];
      if (typeof currentScore === 'string') {
        currentScore = parseInt(currentScore);
      }
      if (currentScore < 0) {
        currentScore = 0;
      }
      if (currentScore > item.paperQuestion.points) {
        currentScore = item.paperQuestion.points;
      }
      if (!_.isNull(currentScore)) {
        item.score = currentScore;
      }
    }
    await this.examResultRepository.save(items);
  }
}
