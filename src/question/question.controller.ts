import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
}
