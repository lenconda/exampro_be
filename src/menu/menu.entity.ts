import { MenuRole } from 'src/role/menu_role.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'menus' })
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  icon: string;

  @Column()
  pathname: string;

  @Column({ default: true })
  show: boolean;

  @Column()
  order: number;

  @OneToMany(() => Menu, (menu) => menu.parentMenu)
  children: Menu[];

  @ManyToOne(() => Menu, (menu) => menu.children, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parentMenu: Menu;

  @OneToMany(() => MenuRole, (menuRole) => menuRole.menu)
  menuRoles: MenuRole[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
