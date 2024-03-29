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
import {
  FindManyOptions,
  In,
  Like,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Question } from './question.entity';
import { QuestionAnswer } from './question_answer.entity';
import { QuestionCategory } from './question_category.entity';
import { QuestionChoice } from './question_choice.entity';
import { QuestionQuestionCategory } from './question_question_category.entity';
import { convertFromRaw } from 'draft-js';

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
      summary: convertFromRaw(JSON.parse(content)).getPlainText(),
      type,
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
      {
        ..._.pick(updates, ['content', 'type']),
        ...(updates.content
          ? {
              summary: convertFromRaw(
                JSON.parse(updates.content),
              ).getPlainText(),
            }
          : {}),
      },
    );
    return;
  }

  async queryQuestions(
    creator: User,
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    categoryIds: number[],
    page,
  ) {
    const query: FindManyOptions<Question> = {
      join: {
        alias: 'questions',
        innerJoin: {
          ...(categoryIds.length > 0
            ? {
                categories: 'questions.categories',
              }
            : {}),
          creator: 'questions.creator',
        },
      },
      where: (qb: SelectQueryBuilder<Question>) => {
        qb.andWhere('creator.email = :email', {
          email: creator.email,
        });
        if (categoryIds.length > 0) {
          qb.andWhere('categories.category.id IN (:categoryId)', {
            categoryId: categoryIds,
          });
        }
      },
      relations: ['choices', 'answers', 'categories', 'categories.category'],
    };
    const { items = [], total = 0 } = await queryWithPagination<
      number,
      Question
    >(
      this.questionRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        query,
        cursorColumn: 'questions.id',
        orderColumn: 'id',
        searchColumns: ['questions.summary'],
        search,
        page,
      },
    );
    return {
      total,
      items: items.map((item) => {
        return _.merge(
          _.omit(item, ['categories']),
          item.type === 'fill_in_blank'
            ? { blankCount: item.answers.length }
            : {},
          {
            categories: (item.categories || []).map(
              (category) => category.category,
            ),
          },
        );
      }),
    };
  }

  async getQuestion(creator: User, id: number) {
    const data = await this.questionRepository.findOne({
      where: {
        id,
        creator: {
          email: creator.email,
        },
      },
      relations: ['answers', 'choices', 'categories', 'categories.category'],
    });

    return _.merge(
      _.omit(data, ['categories']),
      {
        categories: data.categories.map((category) => category.category),
      },
      data.type === 'fill_in_blank' ? { blankCount: data.answers.length } : {},
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
    if (existedQuestionCategories.length) {
      await this.questionQuestionCategoryRepository.delete(
        existedQuestionCategories.map(
          (questionCategory) => questionCategory.id,
        ),
      );
    }
    const questionCategories: QuestionQuestionCategory[] = [];
    for (const question of questions) {
      for (const category of categories) {
        questionCategories.push(
          this.questionQuestionCategoryRepository.create({
            question,
            category,
          }),
        );
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
    const existedQuestionChoices = await this.questionChoiceRepository.find({
      where: {
        question: {
          id: questionId,
        },
      },
    });
    if (existedQuestionChoices.length) {
      await this.questionChoiceRepository.delete(
        existedQuestionChoices.map((questionChoice) => questionChoice.id),
      );
    }
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
    const existedQuestionAnswers = await this.questionAnswerRepository.find({
      where: {
        question: {
          id: questionId,
        },
      },
    });
    if (existedQuestionAnswers.length) {
      await this.questionAnswerRepository.delete(
        existedQuestionAnswers.map((questionAnswers) => questionAnswers.id),
      );
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

  async getCategories(creator: User, search?: string) {
    const items = await this.questionCategoryRepository.find({
      where: {
        creator: {
          email: creator.email,
        },
        ...(search
          ? {
              name: Like(search),
            }
          : {}),
      },
    });

    return {
      items,
      total: items.length,
    };
  }

  async getCategory(creator: User, id: number) {
    const data = await this.questionCategoryRepository.findOne({
      where: {
        creator: {
          email: creator.email,
        },
        id,
      },
    });
    return data || null;
  }

  async deleteCategory(creator: User, ids: number[]) {
    const categories = await this.questionCategoryRepository.find({
      where: {
        creator: {
          email: creator.email,
        },
        id: In(ids),
      },
    });
    await this.questionCategoryRepository.delete(
      categories.map((category) => category.id),
    );
  }
}
