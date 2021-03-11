import { Question } from 'src/question/question.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { PaperQuestion } from './paper_question.entity';
import { PaperUser } from './paper_user.entity';

@Entity({ name: 'papers' })
export class Paper {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  public: boolean;

  @Column()
  title: string;

  @OneToMany(() => PaperQuestion, (paperQuestion) => paperQuestion.paper)
  questions: Question[];

  @OneToMany(() => PaperUser, (paperUser) => paperUser.paper)
  users: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}