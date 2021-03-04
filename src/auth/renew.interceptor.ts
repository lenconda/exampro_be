import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import jwt from 'jsonwebtoken';
import _ from 'lodash';

export type Response = Record<string, any>;

@Injectable()
export class RenewInterceptor<T> implements NestInterceptor<T, Response> {
  constructor(
    @Inject('AuthService')
    private readonly authService: AuthService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response> {
    const request = context.switchToHttp().getRequest();
    const token = ((request?.headers?.authorization as string) || '').slice(7);
    const user = request?.user || {};
    const email = user?.email || '';
    if (token && email) {
      const payload = jwt.decode(token);
      const { exp = Date.now() / 1000 } = payload as Record<string, any>;
      const expireTimestamp = exp * 1000;
      const additionalResponseData = {} as Record<string, any>;
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
