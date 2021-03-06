import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/role/user_role.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import md5 from 'md5';
import { Role } from 'src/role/role.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async addAdminUser(email: string, password: string, roleIds: string[]) {
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
