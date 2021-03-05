import { Menu } from 'src/menu/menu.entity';
import {
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity({ name: 'menu_role' })
export class MenuRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Menu, (menu) => menu.menuRoles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  menu: Menu;

  @ManyToOne(() => Role, (role) => role.menuRoles, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  role: Role;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
