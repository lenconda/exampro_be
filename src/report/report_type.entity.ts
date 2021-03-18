import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Report } from './report.entity';

@Entity({ name: 'report_types' })
export class ReportType {
  @PrimaryColumn()
  id: string;

  @OneToMany(() => Report, (report) => report.type)
  reports: Report[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
