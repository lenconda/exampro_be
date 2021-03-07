import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserNotification } from './user_notification.entity';

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ default: '' })
  content: string;

  @CreateDateColumn({ name: 'time' })
  time: Date;

  @Column({ default: '' })
  subject: string;

  @Column({ default: true, select: false })
  broadcast: boolean;

  @ManyToOne(() => User, (user) => user.sendedNotifications, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'sender_email' })
  sender: User;

  @OneToMany(
    () => UserNotification,
    (userNotifications) => userNotifications.notification,
    { onDelete: 'CASCADE', onUpdate: 'CASCADE' },
  )
  userNotifications: UserNotification[];
}
