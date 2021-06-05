import { PaperQuestion } from 'src/paper/paper_question.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exam } from './exam.entity';

@Entity({ name: 'exam_result' })
export class ExamResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, default: null, type: 'longtext' })
  content: string;

  @Column({ nullable: true, default: null })
  score: number;

  @ManyToOne(
    () => PaperQuestion,
    (paperQuestion) => paperQuestion.examResults,
    {
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'paper_question_id' })
  paperQuestion: PaperQuestion;

  @ManyToOne(() => User, (user) => user.participatedExamsResults, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participant_email' })
  participant: User;

  @ManyToOne(() => Exam, (exam) => exam.users, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
