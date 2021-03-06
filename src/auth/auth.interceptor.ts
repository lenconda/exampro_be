import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import _ from 'lodash';
import { UserService } from 'src/user/user.service';
import { ERR_USER_BANNED } from 'src/constants';

export type Response = Record<string, any>;

@Injectable()
export class AuthInterceptor<T> implements NestInterceptor<T, Response> {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<Response>> {
    const request = context.switchToHttp().getRequest();
    const pathname = request.path;
    const token = ((request?.headers?.authorization as string) || '').slice(7);
    const isTokenBlocked = await this.authService.checkToken(token);

    if (isTokenBlocked) {
      throw new UnauthorizedException();
    }

    /**
     * 如果请求登出接口，将要把当前的 token 加入黑名单
     */
    if (pathname === '/api/auth/logout') {
      await this.authService.blockToken(token);
      return next.handle();
    }

    const user = request?.user || {};
    const email = user?.email || '';
    const banStatus = await this.userService.checkUserBanStatus(email);

    if (banStatus) {
      throw new ForbiddenException(`${ERR_USER_BANNED}:${banStatus}`);
    }

    if (token && email) {
      const payload = this.authService.decode(token);
      const { exp = Date.now() / 1000 } = payload as Record<string, any>;
      const expireTimestamp = exp * 1000;
      const additionalResponseData = {} as Record<string, any>;

      /**
       * 如果当前 token 还差一分钟就要过期，则更新一次 token
       */
      if (expireTimestamp - Date.now() < 60000) {
        additionalResponseData.token = this.authService.sign(email);
      }
      return next
        .handle()
        .pipe(map((data) => _.merge(data, additionalResponseData)));
    } else {
      return next.handle();
    }
  }
}
