import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roleNames = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    ); // 从控制器注解中得到的角色组信息。

    if (!roleNames) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasRole = () => {
      return user.userRoles
        .map((userRole) => userRole.name)
        .some((roleName) => roleNames.includes(roleName)); // 是否匹配到角色
    };

    return user && user.userRoles && _.isArray(user.userRoles) && hasRole();
  }
}
