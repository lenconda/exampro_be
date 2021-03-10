import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import {
  ERR_CHOICES_NOT_ALLOWED,
  ERR_QUESTION_MODIFICATION_PROHIBITED,
} from 'src/constants';
import { User } from 'src/user/user.entity';
import { queryWithPagination } from 'src/utils/pagination';
import { FindManyOptions, In, Repository, SelectQueryBuilder } from 'typeorm';
import { Question } from './question.entity';
import { QuestionAnswer } from './question_answer.entity';
import { QuestionCategory } from './question_category.entity';
import { QuestionChoice } from './question_choice.entity';
import { QuestionQuestionCategory } from './question_question_category.entity';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionAnswer)
    private readonly questionAnswerRepository: Repository<QuestionAnswer>,
    @InjectRepository(QuestionCategory)
    private readonly questionCategoryRepository: Repository<QuestionCategory>,
    @InjectRepository(QuestionChoice)
    private readonly questionChoiceRepository: Repository<QuestionChoice>,
    @InjectRepository(QuestionQuestionCategory)
    private readonly questionQuestionCategoryRepository: Repository<QuestionQuestionCategory>,
  ) {}

  async createQuestion(
    creator: User,
    content: string,
    type: string,
    mode: string,
    categoryIds: number[],
  ) {
    const categories = await this.questionCategoryRepository.find({
      where: {
        id: In(categoryIds),
      },
    });
    const question = this.questionRepository.create({
      creator,
      content,
      type,
      mode,
    });
    await this.questionRepository.save(question);
    const questionCategories = categories.map((category) => {
      return this.questionQuestionCategoryRepository.create({
        category,
        question,
      });
    });
    await this.questionQuestionCategoryRepository.save(questionCategories);
    return question;
  }

  async updateQuestion(
    creator: User,
    questionId: number,
    updates: Record<string, any>,
  ) {
    await this.questionRepository.update(
      {
        id: questionId,
        creator: {
          email: creator.email,
        },
      },
      _.pick(updates, ['content', 'type', 'mode']),
    );
    return;
  }

  async getQuestions(
    creator: User,
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    categoryIds: number[],
  ) {
    const query: FindManyOptions<Question> =
      categoryIds.length > 0
        ? {
            join: {
              alias: 'questions',
              innerJoin: {
                categories: 'questions.categories',
              },
            },
            where: (qb: SelectQueryBuilder<Question>) => {
              qb.where({
                creator: {
                  email: creator.email,
                },
              }).andWhere('categories.category.id IN (:categoryId)', {
                categoryId: categoryIds,
              });
            },
          }
        : {
            where: {
              creator: {
                email: creator.email,
              },
            },
          };
    return queryWithPagination<number, Question>(
      this.questionRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      { query },
    );
  }

  async createCategory(creator: User, name: string) {
    const existedCategory = await this.questionCategoryRepository.findOne({
      where: {
        creator: { email: creator.email },
        name,
      },
    });
    if (existedCategory) {
      return existedCategory;
    }
    const category = this.questionCategoryRepository.create({
      creator,
      name,
    });
    await this.questionCategoryRepository.save(category);
    return category;
  }

  async createQuestionCategories(
    creator: User,
    questionIds: number[],
    categoryIds: number[],
  ) {
    const questions = await this.questionRepository.find({
      where: {
        id: In(questionIds),
        creator: {
          email: creator.email,
        },
      },
      relations: ['creator'],
    });
    const categories = await this.questionCategoryRepository.find({
      where: {
        id: In(categoryIds),
        creator: {
          email: creator.email,
        },
      },
      relations: ['creator'],
    });
    const existedQuestionCategories = await this.questionQuestionCategoryRepository.find(
      {
        where: {
          question: {
            id: In(questionIds),
          },
          category: {
            id: In(categoryIds),
          },
        },
        relations: ['question', 'category'],
      },
    );
    const questionCategories: QuestionQuestionCategory[] = [];
    for (const question of questions) {
      for (const category of categories) {
        if (
          existedQuestionCategories.findIndex((questionCategory) => {
            return (
              questionCategory.category.id === category.id &&
              questionCategory.question.id === question.id
            );
          }) === -1
        ) {
          questionCategories.push(
            this.questionQuestionCategoryRepository.create({
              question,
              category,
            }),
          );
        }
      }
    }
    await this.questionQuestionCategoryRepository.save(questionCategories);
  }

  async deleteQuestionsCategories(
    creator: User,
    questionIds: number[],
    categoryIds: number[],
  ) {
    const questionCategories = await this.questionQuestionCategoryRepository.find(
      {
        where: {
          question: {
            id: In(questionIds),
            creator: {
              email: creator.email,
            },
          },
          category: {
            id: In(categoryIds),
            creator: {
              email: creator.email,
            },
          },
        },
        relations: [
          'question',
          'category',
          'question.creator',
          'category.creator',
        ],
      },
    );
    await this.questionQuestionCategoryRepository.delete(
      questionCategories.map((questionCategory) => questionCategory.id),
    );
  }

  async createQuestionChoices(
    creator: User,
    questionId: number,
    choices: Record<string, any>[],
  ) {
    const question = await this.questionRepository.findOne({
      where: {
        id: questionId,
      },
      relations: ['creator'],
    });
    if (!question) {
      throw new NotFoundException();
    }
    if (creator.email !== question.creator.email) {
      throw new ForbiddenException(ERR_QUESTION_MODIFICATION_PROHIBITED);
    }
    if (
      question.type !== 'multiple_choices' &&
      question.type !== 'single_choice'
    ) {
      throw new BadRequestException(ERR_CHOICES_NOT_ALLOWED);
    }
    const questionChoices = choices.map((choice) => {
      return this.questionChoiceRepository.create({
        question,
        ..._.pick(choice, ['content', 'order']),
      });
    });
    await this.questionChoiceRepository.save(questionChoices);
    return { items: questionChoices };
  }

  async updateQuestionChoice(
    creator: User,
    questionId: number,
    choiceId: number,
    updates: Record<string, any>,
  ) {
    const choice = await this.questionChoiceRepository.findOne({
      where: {
        id: choiceId,
      },
      relations: ['question', 'question.creator'],
    });
    if (!choice) {
      throw new NotFoundException();
    }
    if (choice.question.creator.email !== creator.email) {
      throw new ForbiddenException();
    }
    if (choice.question.id !== questionId) {
      throw new ForbiddenException();
    }
    await this.questionChoiceRepository.update(
      { id: choiceId },
      _.pick(updates, ['order', 'content']),
    );
  }

  async deleteQuestionChoices(
    creator: User,
    questionId: number,
    choiceIds: number[],
  ) {
    const choices = await this.questionChoiceRepository.find({
      where: {
        id: In(choiceIds),
        question: {
          id: questionId,
          creator: {
            email: creator.email,
          },
        },
      },
      relations: ['question', 'question.creator'],
    });
    await this.questionChoiceRepository.delete(
      choices.map((choice) => choice.id),
    );
  }

  async createQuestionAnswers(
    creator: User,
    questionId: number,
    answers: Record<string, any>[],
  ) {
    const question = await this.questionRepository.findOne({
      where: {
        id: questionId,
      },
      relations: ['creator'],
    });
    if (!question) {
      throw new NotFoundException();
    }
    if (creator.email !== question.creator.email) {
      throw new ForbiddenException(ERR_QUESTION_MODIFICATION_PROHIBITED);
    }
    const questionAnswers = answers.map((answer) => {
      return this.questionAnswerRepository.create({
        question,
        ..._.pick(answer, ['content', 'order']),
      });
    });
    await this.questionAnswerRepository.save(questionAnswers);
    return { items: questionAnswers };
  }

  async deleteQuestions(creator: User, questionIds: number[]) {
    const questions = await this.questionRepository.find({
      where: {
        creator: {
          email: creator.email,
        },
        id: In(questionIds),
      },
    });
    await this.questionRepository.delete(
      questions.map((question) => question.id),
    );
  }

  async updateQuestionAnswer(
    creator: User,
    questionId: number,
    answerId: number,
    updates: Record<string, any>,
  ) {
    const answer = await this.questionAnswerRepository.findOne({
      where: {
        id: answerId,
      },
      relations: ['question', 'question.creator'],
    });
    if (!answer) {
      throw new NotFoundException();
    }
    if (answer.question.creator.email !== creator.email) {
      throw new ForbiddenException();
    }
    if (answer.question.id !== questionId) {
      throw new ForbiddenException();
    }
    await this.questionAnswerRepository.update(
      { id: answerId },
      _.pick(updates, ['order', 'content']),
    );
  }

  async deleteQuestionAnswers(
    creator: User,
    questionId: number,
    answerIds: number[],
  ) {
    const answers = await this.questionAnswerRepository.find({
      where: {
        id: In(answerIds),
        question: {
          id: questionId,
          creator: {
            email: creator.email,
          },
        },
      },
      relations: ['question', 'question.creator'],
    });
    await this.questionAnswerRepository.delete(
      answers.map((answer) => answer.id),
    );
  }
}
