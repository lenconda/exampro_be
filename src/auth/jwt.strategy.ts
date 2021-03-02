import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
// @ts-ignore
import apprc from '../../.apprc';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: apprc.jwt.secret,
    });
  }

  async validate(/* params */): Promise<any> {
    /*
      if (!validate_condition) {
        throw new UnauthorizedException();
      } else {
        return await this.authService.findUser(some_payload);
      }
    */
  }
}

/**
 * @example xxx.controller.ts
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/user.entity';
import { CurrentUser } from '../user/user.decorator';
import { PreferencesService } from './preferences.service';

@Controller('/api')
export class PreferencesController {
  constructor() {}

  @UseGuards(AuthGuard('jwt'))
  @Get('/info')
  async getInfo(@CurrentUser() user: User) {
    return user;
  }
}
 */

/**
 * @example user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest().user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
 */
