import { Exam } from 'src/exam/exam.entity';
import { Paper } from 'src/paper/paper.entity';
import { User } from 'src/user/user.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReportType } from './report_type.entity';

export type ReportStatus = 'committed' | 'accepted' | 'denied';

@Entity({ name: 'reports' })
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ['committed', 'accepted', 'denied'],
    default: 'committed',
  })
  status: ReportStatus;

  @ManyToOne(() => User, (user) => user.reportedReports, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => User, (user) => user.reports, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'user_email' })
  user: User;

  @ManyToOne(() => Exam, (exam) => exam.reports, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;

  @ManyToOne(() => Paper, (paper) => paper.reports, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'paper_id' })
  paper: Paper;

  @ManyToOne(() => ReportType, (reportType) => reportType.reports, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'type_id' })
  type: ReportType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
