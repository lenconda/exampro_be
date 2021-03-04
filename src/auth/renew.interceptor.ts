import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

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
    return next.handle();
    // return next.handle().pipe(
    //   map((data) => ({
    //     ...data,
    //     token: 'fuck you',
    //   })),
    // );
  }
}
