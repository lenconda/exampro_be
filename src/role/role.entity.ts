import {
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { UserRole } from './user_role.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryColumn()
  id: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.role, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  userRoles: UserRole[];
}
