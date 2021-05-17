import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { PaperQuestion } from 'src/paper/paper_question.entity';
import { User } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamResult } from './exam_result.entity';
import { ExamUser } from './exam_user.entity';

export type QuestionAnswer = Record<string, string[]>;
export type QuestionScore = Record<string, number>;

@Injectable()
export class ExamResultService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamResult)
    private readonly examResultRepository: Repository<ExamResult>,
    @InjectRepository(PaperQuestion)
    private readonly paperQuestionRepository: Repository<PaperQuestion>,
    @InjectRepository(ExamUser)
    private readonly examUserRepository: Repository<ExamUser>,
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
    const examUser = await this.examUserRepository.findOne({
      where: {
        user: {
          email: participant.email,
        },
        role: {
          id: 'resource/exam/participant',
        },
        exam: {
          id: examId,
        },
      },
    });
    if (existedExamResults.length > 0) {
      await this.examResultRepository.delete(
        existedExamResults.map((relation) => relation.id),
      );
    }
    const exam = await this.examRepository.findOne({
      where: {
        id: examId,
      },
      relations: ['paper'],
    });
    const paperQuestions = await this.paperQuestionRepository.find({
      where: {
        paper: {
          id: exam.paper.id,
        },
        question: {
          id: In(Object.keys(questionAnswer).map((key) => parseInt(key))),
        },
      },
      relations: ['question'],
    });
    const questionToPaperQuestionMap = paperQuestions.reduce(
      (result, paperQuestion) => {
        result[paperQuestion.question.id] = paperQuestion.id;
        return result;
      },
      {},
    );
    const currentTimestamp = Date.now();
    const endTimestamp = exam.endTime.getTime();
    if (currentTimestamp > endTimestamp + 10000) {
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
              id: questionToPaperQuestionMap[questionId],
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
    if (examUser) {
      await this.examUserRepository.update(
        { id: examUser.id },
        {
          submitTime: new Date(),
        },
      );
    }
    await this.examResultRepository.save(examResults);
  }

  async getParticipantExamResult(examId: number, email: string) {
    const exam = await this.examRepository.findOne({
      where: {
        id: examId,
      },
      relations: ['paper'],
    });
    if (!exam) {
      return {};
    }
    const examPaperQuestions = await this.paperQuestionRepository.find({
      where: {
        paper: {
          id: exam.paper.id,
        },
      },
      relations: ['question', 'paper'],
    });
    const resultItems = await this.examResultRepository.find({
      where: {
        exam: {
          id: examId,
        },
        participant: {
          email,
        },
      },
      relations: [
        'exam',
        'participant',
        'paperQuestion',
        'paperQuestion.question',
      ],
    });
    return examPaperQuestions.reduce((result, currentItem) => {
      const currentQuestionId = currentItem.question.id;
      const currentResultItems = resultItems.filter(
        (item) => item.paperQuestion.question.id === currentQuestionId,
      );
      if (!result[currentQuestionId]) {
        result[currentQuestionId.toString()] = {
          answer: currentResultItems.map((item) => item.content),
          scores:
            currentResultItems.length > 0 ? currentResultItems[0].score : 0,
          points: currentItem.points,
        };
      }
      if (!_.isArray(result[currentQuestionId].answer)) {
        result[currentQuestionId].answer = [];
      }
      return result;
    }, {});
  }

  async putScores(examId: number, email: string, score: QuestionScore) {
    const userExam = await this.examUserRepository.findOne({
      where: {
        exam: {
          id: examId,
        },
        user: {
          email,
        },
        role: {
          id: 'resource/exam/participant',
        },
      },
    });
    if (userExam) {
      this.examUserRepository.update(
        {
          id: userExam.id,
        },
        {
          reviewing: false,
        },
      );
    }
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['paper'],
    });
    if (!exam) {
      return;
    }
    const paperQuestions = await this.paperQuestionRepository.find({
      where: {
        paper: {
          id: exam.paper.id,
        },
        question: {
          id: In(Object.keys(score).map((key) => parseInt(key))),
        },
      },
      relations: ['question'],
    });
    if (paperQuestions.length === 0) {
      return;
    }
    const questionToPaperQuestionMap = paperQuestions.reduce(
      (result, paperQuestion) => {
        result[paperQuestion.question.id] = paperQuestion.id;
        return result;
      },
      {},
    );
    const items = await this.examResultRepository.find({
      where: {
        exam: {
          id: examId,
        },
        participant: {
          email,
        },
        paperQuestion: {
          id: In(
            Object.keys(score).map(
              (questionId) => questionToPaperQuestionMap[questionId],
            ),
          ),
        },
      },
      relations: ['paperQuestion', 'paperQuestion.question'],
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

  async getScoresList(examId: number) {
    const resultMap = {};
    const items = await this.examResultRepository.find({
      where: {
        id: examId,
      },
      relations: [
        'participant',
        'paperQuestion',
        'paperQuestion.question',
        'paperQuestion.question.choices',
      ],
    });
    for (const item of items) {
      const { email } = item.participant;
      if (!resultMap[email]) {
        resultMap[email] = {};
      }
      if (!resultMap[email][item.paperQuestion.question.id]) {
        resultMap[email][item.paperQuestion.question.id] = {
          score: item.score,
          paperQuestion: item.paperQuestion,
        };
      }
    }
    const result = Object.keys(resultMap).map((email) => {
      const questionScoresMap = resultMap[email];
      const questionScoreItems = Object.keys(questionScoresMap).map(
        (questionId) => questionScoresMap[questionId],
      );
      const sortedScores = _.sortBy(
        questionScoreItems,
        (item) => item.paperQuestion.order,
      ).map((item) => ({
        score: item.score,
        question: item.paperQuestion.question,
      }));
      return {
        email,
        scores: sortedScores,
      };
    });
    return { items: result };
  }
}
