import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  JoinTable,
} from 'typeorm';

@Entity({ name: 'exams' })
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  // @OneToMany(() => PaperQuestion, (paperQuestion) => paperQuestion.paper)
  // @JoinTable()
  // questions: PaperQuestion[];

  // @OneToMany(() => PaperUser, (paperUser) => paperUser.paper)
  // users: PaperUser[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
