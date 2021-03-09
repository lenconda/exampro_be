import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
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

  @Post('/category')
  async createQuestionCategory(
    @CurrentUser() user,
    @Body('name') name: string,
  ) {
    return await this.questionService.createQuestionCategory(user, name);
  }

  @Post('/:id/choices')
  async createQuestionChoices(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body('choices') choices: Record<string, any>[] = [],
  ) {
    return await this.questionService.createQuestionChoices(
      user,
      parseInt(id),
      choices,
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

  @Post('/:id/answers')
  async createQuestionAnswers(
    @CurrentUser() user,
    @Param('id') id: string,
    @Body('answers') answers: Record<string, any>[] = [],
  ) {
    return await this.questionService.createQuestionAnswers(
      user,
      parseInt(id),
      answers,
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
}
