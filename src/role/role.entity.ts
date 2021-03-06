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

  @OneToMany(() => MenuRole, (menuRole) => menuRole.role, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  menuRoles: MenuRole[];
}
