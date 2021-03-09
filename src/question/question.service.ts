import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import {
  ERR_QUESTION_MODIFICATION_PROHIBITED,
  ERR_QUESTION_NOT_FOUND,
} from 'src/constants';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
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
        id: categoryIds,
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
      throw new BadRequestException(ERR_QUESTION_NOT_FOUND);
    }
    if (creator.email !== question.creator.email) {
      throw new ForbiddenException(ERR_QUESTION_MODIFICATION_PROHIBITED);
    }
    const questionChoices = choices.map((choice) => ({
      question,
      ..._.pick(choice, ['content', 'order']),
    }));
    await this.questionChoiceRepository.save(questionChoices);
    return { items: questionChoices };
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
      throw new BadRequestException(ERR_QUESTION_NOT_FOUND);
    }
    if (creator.email !== question.creator.email) {
      throw new ForbiddenException(ERR_QUESTION_MODIFICATION_PROHIBITED);
    }
    const questionAnswers = answers.map((answer) => ({
      question,
      ..._.pick(answer, ['content', 'order']),
    }));
    await this.questionAnswerRepository.save(questionAnswers);
    return { items: questionAnswers };
  }

  async createQuestionCategory(creator: User, name: string) {
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
}
