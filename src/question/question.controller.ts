import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/user/user.decorator';
import { QuestionService } from './question.service';

@Controller('/api/question')
@UseGuards(AuthGuard('jwt'))
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Post()
  async createQuestion(
    @CurrentUser() user,
    @Body('content') content: string,
    @Body('type') type: string,
    @Body('mode') mode: string,
    @Body('categories') categories: number[] = [],
  ) {
    return await this.questionService.createQuestion(
      user,
      content,
      type,
      mode,
      categories,
    );
  }

  @Delete()
  async deleteQuestions(
    @CurrentUser() user,
    @Body('questions') questionIds: string[],
  ) {
    return await this.questionService.deleteQuestions(
      user,
      questionIds.map((questionId) => parseInt(questionId)),
    );
  }

  @Get()
  async getQuestions(
    @CurrentUser() user,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('categories') categoryIdsString = '',
  ) {
    const categoryIds = (categoryIdsString
      ? categoryIdsString.split(',')
      : []
    ).map((id) => parseInt(id));
    return await this.questionService.getQuestions(
      user,
      lastCursor ? parseInt(lastCursor) : null,
      parseInt(size),
      order,
      categoryIds,
    );
  }

  @Post('/category')
  async createQuestionCategory(
    @CurrentUser() user,
    @Body('name') name: string,
  ) {
    return await this.questionService.createCategory(user, name);
  }

  @Post('/question_categories')
  async createQuestionsCategories(
    @CurrentUser() user,
    @Body('questions') questionIds: string[],
    @Body('categories') categoryIds: string[],
  ) {
    return await this.questionService.createQuestionCategories(
      user,
      questionIds.map((questionId) => parseInt(questionId)),
      categoryIds.map((categoryId) => parseInt(categoryId)),
    );
  }

  @Delete('/question_categories')
  async deleteQuestionsCategories(
    @CurrentUser() user,
    @Body('questions') questionIds: string[],
    @Body('categories') categoryIds: string[],
  ) {
    return await this.questionService.deleteQuestionsCategories(
      user,
      questionIds.map((questionId) => parseInt(questionId)),
      categoryIds.map((categoryId) => parseInt(categoryId)),
    );
  }

  @Post('/:question/categories')
  async createQuestionCategories(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body('categories') categoryIds: string[],
  ) {
    return await this.questionService.createQuestionCategories(
      user,
      [parseInt(questionId)],
      categoryIds.map((categoryId) => parseInt(categoryId)),
    );
  }

  @Delete('/:question/categories')
  async deleteQuestionCategories(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body('categories') categoryIds: string[],
  ) {
    return await this.questionService.deleteQuestionsCategories(
      user,
      [parseInt(questionId)],
      categoryIds.map((categoryId) => parseInt(categoryId)),
    );
  }

  @Post('/:question/choices')
  async createQuestionChoices(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body('choices') choices: Record<string, any>[] = [],
  ) {
    return await this.questionService.createQuestionChoices(
      user,
      parseInt(questionId),
      choices,
    );
  }

  @Delete('/:question/choices')
  async deleteQuestionChoices(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body('choices') choiceIds: string[] = [],
  ) {
    return await this.questionService.deleteQuestionChoices(
      user,
      parseInt(questionId),
      choiceIds.map((choiceId) => parseInt(choiceId)),
    );
  }

  @Patch('/:question/choices/:choice')
  async updateQuestionChoices(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Param('choice') choiceId: string,
    @Body() updates: Record<string, any> = {},
  ) {
    return await this.questionService.updateQuestionChoice(
      user,
      parseInt(questionId),
      parseInt(choiceId),
      updates,
    );
  }

  @Delete('/:question/choices/:choice')
  async deleteQuestionChoice(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Param('choice') choiceId: string,
  ) {
    return await this.questionService.deleteQuestionChoices(
      user,
      parseInt(questionId),
      [parseInt(choiceId)],
    );
  }

  @Post('/:question/answers')
  async createQuestionAnswers(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body('answers') answers: Record<string, any>[] = [],
  ) {
    return await this.questionService.createQuestionAnswers(
      user,
      parseInt(questionId),
      answers,
    );
  }

  @Delete('/:question/answers')
  async deleteQuestionAnswers(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body('answers') answerIds: string[] = [],
  ) {
    return await this.questionService.deleteQuestionAnswers(
      user,
      parseInt(questionId),
      answerIds.map((answerId) => parseInt(answerId)),
    );
  }

  @Patch('/:question/answers/:answer')
  async updateQuestionAnswers(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Param('answer') answerId: string,
    @Body() updates: Record<string, any> = {},
  ) {
    return await this.questionService.updateQuestionAnswer(
      user,
      parseInt(questionId),
      parseInt(answerId),
      updates,
    );
  }

  @Delete('/:question/answers/:answer')
  async deleteQuestionAnswer(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Param('answer') answerId: string,
  ) {
    return await this.questionService.deleteQuestionAnswers(
      user,
      parseInt(questionId),
      [parseInt(answerId)],
    );
  }

  @Patch('/:question')
  async updateQuestion(
    @CurrentUser() user,
    @Param('question') questionId: string,
    @Body() updates: Record<string, any>,
  ) {
    return await this.questionService.updateQuestion(
      user,
      parseInt(questionId),
      updates,
    );
  }

  @Delete('/:question')
  async deleteQuestion(
    @CurrentUser() user,
    @Param('question') questionId: string,
  ) {
    return await this.questionService.deleteQuestions(user, [
      parseInt(questionId),
    ]);
  }
}
