import { Paper } from 'src/paper/paper.entity';
import { Report } from 'src/report/report.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ExamUser } from './exam_user.entity';

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: 0 })
  delay: number;

  @Column({ default: true, name: 'notify_participants' })
  notifyParticipants: boolean;

  @Column({ default: false })
  public: boolean;

  @Column({ name: 'start_time', nullable: true, default: null })
  startTime: Date;

  @Column({ name: 'end_time', nullable: false })
  endTime: Date;

  @Column({ name: 'result_time', nullable: true })
  resultTime: Date;

  // 是否需要计算成绩
  @Column({ default: true })
  grades: boolean;

  // 考试限时，单位：分钟
  @Column({ nullable: true, default: null })
  duration: number;

  @OneToMany(() => ExamUser, (examUser) => examUser.exam)
  users: ExamUser[];

  @ManyToOne(() => Paper, (paper) => paper.exams, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'paper_id' })
  paper: Paper;

  @OneToMany(() => Report, (report) => report.exam)
  reports: Report[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
