import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';
import { checkPatternMatchValues } from 'src/utils/checkers';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const controllerRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    ); // 从控制器注解中得到的角色组信息。

    if (!controllerRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const hasRole = () => {
      const roles = user.roles.map((role) => role.id);
      for (const controllerRole of controllerRoles) {
        if (checkPatternMatchValues(controllerRole, roles)) {
          return true;
        }
      }
      return false;
    };

    return user && user.roles && _.isArray(user.roles) && hasRole();
  }
}
