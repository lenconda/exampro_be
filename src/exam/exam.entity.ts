import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
} from 'typeorm';
import { ExamUser } from './exam_user.entity';

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @OneToMany(() => ExamUser, (examUser) => examUser.exam)
  users: ExamUser[];

  @Column({ name: 'start_time', nullable: true, default: null })
  startTime: Date;

  @Column({ name: 'end_time', nullable: true, default: null })
  endTime: Date;

  // 考试限时，单位：分钟
  @Column({ nullable: true, default: null })
  duration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
