import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './question.entity';
import { QuestionService } from './question.service';
import { QuestionAnswer } from './question_answer.entity';
import { QuestionCategory } from './question_category.entity';
import { QuestionChoice } from './question_choice.entity';
import { QuestionController } from './question.controller';
import { QuestionQuestionCategory } from './question_question_category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      QuestionAnswer,
      QuestionChoice,
      QuestionCategory,
      QuestionQuestionCategory,
    ]),
  ],
  providers: [QuestionService],
  exports: [QuestionService],
  controllers: [QuestionController],
})
export class QuestionModule {}
