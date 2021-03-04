import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role/role.entity';
import { generateRoles } from './initializers';
import { parseRolesTree } from './utils/parsers';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {
    this.initializer();
  }

  private async initializer() {
    await this.initializeRoles();
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
}
