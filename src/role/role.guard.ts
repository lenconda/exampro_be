import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

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
      return user.userRoles
        .map((userRole) => userRole.name)
        .some((roleName) => roleNames.includes(roleName)); // 是否匹配到角色
    };

    return user && user.userRoles && _.isArray(user.userRoles) && hasRole();
  }
}
