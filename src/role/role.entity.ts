import { ExamUser } from 'src/exam/exam_user.entity';
import { PaperUser } from 'src/paper/paper_user.entity';
import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  PrimaryColumn,
  Column,
} from 'typeorm';
import { MenuRole } from './menu_role.entity';
import { UserRole } from './user_role.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn()
  id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 1 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => MenuRole, (menuRole) => menuRole.role)
  menuRoles: MenuRole[];

  @OneToMany(() => PaperUser, (paperUser) => paperUser.role)
  paperUsers: PaperUser[];

  @OneToMany(() => ExamUser, (examUser) => examUser.role)
  examUsers: ExamUser[];
}
