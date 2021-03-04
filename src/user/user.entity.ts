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

  @Column({ nullable: true, name: 'active_expire' })
  activeExpire: Date;

  @Column({ nullable: true })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => Notification, (notification) => notification.sender, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  sendedNotifications: Notification[];

  @OneToMany(
    () => UserNotification,
    (userNotification) => userNotification.user,
    {
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  )
  userNotifications: UserNotification[];

  @OneToMany(() => UserRole, (userRole) => userRole.user, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  userRoles: UserNotification[];
}
