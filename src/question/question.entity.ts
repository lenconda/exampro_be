import { PaperQuestion } from 'src/paper/paper_question.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  JoinColumn,
  OneToMany,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinTable,
} from 'typeorm';
import { QuestionAnswer } from './question_answer.entity';
import { QuestionChoice } from './question_choice.entity';
import { QuestionQuestionCategory } from './question_question_category.entity';

export enum QuestionTypes {
  // 单选题
  SINGLE_CHOICE = 'single_choice',
  // 多选题
  MULTIPLE_CHOICES = 'multiple_choices',
  // 填空题
  FILL_IN_BLANK = 'fill_in_blank',
  // 简答题
  SHORT_ANSWER = 'short_answer',
}

@Entity({ name: 'questions' })
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'longtext' })
  content: string;

  @OneToMany(
    () => QuestionQuestionCategory,
    (questionQuestionCategory) => questionQuestionCategory.question,
  )
  categories: QuestionQuestionCategory[];

  @OneToMany(() => QuestionAnswer, (answer) => answer.question)
  answers: QuestionAnswer[];

  @OneToMany(() => QuestionChoice, (choice) => choice.question)
  @JoinTable()
  choices: QuestionChoice[];

  @ManyToOne(() => User, (user) => user.questions, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'creator_email' })
  creator: User;

  @OneToMany(() => PaperQuestion, (paperQuestion) => paperQuestion.question)
  papers: PaperQuestion[];

  @Column({ type: 'enum', enum: QuestionTypes })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
