import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';
import minimatch from 'minimatch';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      return user.roles
        .map((role) => role.id)
        .some(
          (roleId) =>
            roleNames.filter((roleName) => minimatch(roleId, roleName)).length >
            0,
        ); // 是否匹配到角色
    };

    return user && user.roles && _.isArray(user.roles) && hasRole();
  }
}
