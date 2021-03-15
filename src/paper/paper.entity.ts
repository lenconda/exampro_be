import { Exam } from 'src/exam/exam.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinTable,
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
  @JoinTable()
  questions: PaperQuestion[];

  @OneToMany(() => PaperUser, (paperUser) => paperUser.paper)
  users: PaperUser[];

  @OneToMany(() => Exam, (exam) => exam.paper)
  exams: Exam[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
