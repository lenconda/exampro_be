import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import _ from 'lodash';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/auth/auth.service';
import {
  ERR_EMAIL_VERIFICATION_REQUIRED,
  ERR_USER_PASSWORD_NOT_SET,
} from './constants';
import ms from 'ms';
import { ConfigService } from './config/config.service';

export type Response = Record<string, any>;

@Injectable()
export class AppInterceptor<T> implements NestInterceptor<T, Response> {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<Response>> {
    const request = context.switchToHttp().getRequest();
    const pathname = request.path as string;
    const token = ((request?.headers?.authorization as string) || '').slice(7);
    const user = request?.user || {};
    const email = user?.email || '';

    if (pathname.startsWith('/api/auth') || _.isEmpty(user) || !token) {
      return next.handle().pipe(
        map(async (data) => {
          let result = data;
          if (!result) {
            result = { message: 'OK', data: {} };
          }
          if (!result.message || !result.data) {
            result = { message: 'OK', data };
          }
          if (token) {
            await this.authService.blockToken(token);
          }
          return result;
        }),
      );
    }

    const userPasswordCheckBlackList = [
      '/api/user/complete/registration',
      '/api/user/complete/forget_password',
    ];

    if (userPasswordCheckBlackList.indexOf(pathname) === -1 && !user.password) {
      throw new ForbiddenException(ERR_USER_PASSWORD_NOT_SET);
    }

    await this.authService.checkUserBanStatus(email);

    const isTokenBlocked = await this.authService.checkToken(token);
    if (!pathname.startsWith('/api/auth') && isTokenBlocked) {
      throw new UnauthorizedException();
    }

    /**
     * 如果请求登出接口，将要把当前的 token 加入黑名单
     */
    if (pathname === '/api/auth/logout') {
      await this.authService.blockToken(token);
    }

    if (pathname !== '/api/user/verify_email' && Boolean(user.verifying)) {
      throw new ForbiddenException(ERR_EMAIL_VERIFICATION_REQUIRED);
    }

    const additionalResponseData = {} as Record<string, any>;

    if (token && email) {
      const payload = this.authService.decode(token);
      const { iat = Date.now() / 1000 } = payload as Record<string, any>;
      const issuedTimestamp = iat * 1000;
      const expireMilliseconds = ms(
        (this.configService.get('jwt.signOptions.expiresIn') as string) ||
          '7 days',
      );
      const expiredTimestamp = issuedTimestamp + expireMilliseconds;

      /**
       * 如果当前 token 还差一分钟就要过期，则更新一次 token
       */
      if (expiredTimestamp - Date.now() < 60000) {
        additionalResponseData.token = this.authService.sign(email);
      }
    }

    return next.handle().pipe(
      map(async (data) => {
        let result = data;
        if (!result) {
          result = { message: 'OK', data: {} };
        }
        if (!result.message || !result.data) {
          result = { message: 'OK', data };
        }
        result = {
          ...result,
          token: additionalResponseData.token,
        };
        if (result.data.token) {
          await this.authService.blockToken(token);
        }
        return result;
      }),
    );
  }
}
