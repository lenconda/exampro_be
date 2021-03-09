import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
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
}
