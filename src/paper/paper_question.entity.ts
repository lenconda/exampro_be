import { ExamResult } from 'src/exam/exam_result.entity';
import { Question } from 'src/question/question.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Paper } from './paper.entity';

@Entity({ name: 'paper_question' })
export class PaperQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  order: number;

  @Column()
  points: number;

  @OneToMany(() => ExamResult, (examResult) => examResult.paperQuestion)
  examResults: ExamResult[];

  @ManyToOne(() => Question, (question) => question.papers, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @ManyToOne(() => Paper, (paper) => paper.questions, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paper_id' })
  paper: Paper;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
