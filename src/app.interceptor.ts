import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from 'src/auth/auth.service';

export type Response = Record<string, any>;

@Injectable()
export class AppInterceptor<T> implements NestInterceptor<T, Response> {
  constructor(private readonly authService: AuthService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<Response>> {
    const request = context.switchToHttp().getRequest();
    const pathname = request.path as string;
    const token = ((request?.headers?.authorization as string) || '').slice(7);
    const user = request?.user || {};
    const email = user?.email || '';

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

    const additionalResponseData = {} as Record<string, any>;

    if (token && email) {
      const payload = this.authService.decode(token);
      const { exp = Date.now() / 1000 } = payload as Record<string, any>;
      const expireTimestamp = exp * 1000;

      /**
       * 如果当前 token 还差一分钟就要过期，则更新一次 token
       */
      if (expireTimestamp - Date.now() < 60000) {
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
        if (additionalResponseData.token) {
          await this.authService.blockToken(token);
          result = {
            ...result,
            token: additionalResponseData.token,
          };
        }
        return result;
      }),
    );
  }
}
