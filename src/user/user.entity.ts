import { Notification } from 'src/notification/notification.entity';
import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { UserNotification } from 'src/notification/user_notification.entity';
import { UserRole } from 'src/role/user_role.entity';
import { Question } from 'src/question/question.entity';
import { QuestionCategory } from 'src/question/question_category.entity';
import { PaperUser } from 'src/paper/paper_user.entity';
import { Paper } from 'src/paper/paper.entity';
import { ExamUser } from 'src/exam/exam_user.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn()
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ default: '/assets/images/default_avatar.jpg' })
  avatar: string;

  @Column({ select: false, nullable: true })
  code: string;

  @Column({ default: false })
  active: boolean;

  @Column({ nullable: true, name: 'active_expire', select: false })
  activeExpire: Date;

  @Column({ nullable: true })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Notification, (notification) => notification.sender)
  sendedNotifications: Notification[];

  @OneToMany(() => PaperUser, (paperUser) => paperUser.user)
  papers: Paper[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
  )
  userNotifications: UserNotification[];

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => Question, (question) => question.creator)
  questions: Question[];

  @OneToMany(
    () => QuestionCategory,
    (questionCategory) => questionCategory.creator,
  )
  questionCategories: QuestionCategory[];

  @OneToMany(() => ExamUser, (examUser) => examUser.user)
  exams: ExamUser[];
}
