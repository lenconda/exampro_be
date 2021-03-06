import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import md5 from 'md5';
import { Role } from 'src/role/role.entity';
import { UserRole } from 'src/role/user_role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async createUser(email: string, password: string, code: string, exp: number) {
    const user = this.userRepository.create({
      email,
      password: md5(password),
      avatar: '/assets/images/default_avatar.jpg',
      code,
      activeExpire: new Date(Date.now() + exp),
    });
    await this.userRepository.insert(user);
    return user;
  }

  async createAdminUser(email: string, password: string, roleIds: string[]) {
    const adminUser = this.userRepository.create({
      email,
      password: md5(password),
      active: true,
    });
    const roles = await this.roleRepository.find({
      where: roleIds.map((roleId) => ({
        id: roleId,
      })),
    });
    const userRoles = roles.map((role) => ({
      role,
      user: adminUser,
    }));
    await this.userRepository.save(adminUser);
    await this.userRoleRepository.save(userRoles);
    return adminUser;
  }
}
