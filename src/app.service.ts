import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role/role.entity';
import { generateRoles } from './initializers';
import { parseRolesTree } from './utils/parsers';
import { User } from './user/user.entity';
import { UserRole } from './role/user_role.entity';
import md5 from 'md5';
import { ConfigService } from './config/config.service';
import { AdminService } from './admin/admin.service';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly configService: ConfigService,
    private readonly adminService: AdminService,
  ) {
    this.initializer();
  }

  private async initializer() {
    await this.initializeRoles();
    await this.initializeRootAdmin();
  }

  private async initializeRoles() {
    const rolesTree = generateRoles();
    const roles = parseRolesTree(rolesTree);
    try {
      await this.roleRepository
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values(roles)
        .orIgnore()
        .execute();
    } catch {}
  }

  private async initializeRootAdmin() {
    const { email, password } = this.configService.get('rootAdmin');
    const admin = this.userRepository.create({
      email,
      name: 'root',
      password: md5(password),
    });
    await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(User)
      .values([admin])
      .orIgnore()
      .execute();
    const roles = await this.roleRepository.find({
      where: [{ id: 'user/admin/system' }],
    });
    try {
      await this.userRoleRepository.save(
        roles.map((role) => ({ role, user: admin })),
      );
    } catch {}
  }
}
