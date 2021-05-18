import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'dynamic' })
export class Dynamic {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  pathname: string;

  @Column({ type: 'longtext' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
