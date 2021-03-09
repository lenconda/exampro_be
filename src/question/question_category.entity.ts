import { User } from 'src/user/user.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { Question } from './question.entity';
import { QuestionQuestionCategory } from './question_question_category.entity';

@Entity({ name: 'question_categories' })
export class QuestionCategory {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ unique: true })
  name: string;

  @OneToMany(
    () => QuestionQuestionCategory,
    (questionQuestionCategory) => questionQuestionCategory.category,
  )
  questions: Question[];

  @ManyToOne(() => User, (user) => user.questionCategories, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'creator_email' })
  creator: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
