import { Role } from 'src/role/role.entity';
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

@Entity({ name: 'exam_user' })
export class ExamUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true, nullable: false })
  confirmed: boolean;

  @Column({ default: false, nullable: false })
  fraud: boolean;

  @Column({ name: 'left_times', default: 0 })
  leftTimes: number;

  @Column({ name: 'start_time', nullable: true, default: null })
  startTime: Date;

  @Column({ name: 'submit_time', nullable: true, default: null })
  submitTime: Date;

  @Column({ default: false, nullable: false })
  reviewing: boolean;

  @Column({ default: null, nullable: true })
  reviewer: string;

  @ManyToOne(() => Role, (role) => role.id, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, (user) => user.exams, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_email' })
  user: User;

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
