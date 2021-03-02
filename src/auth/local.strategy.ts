import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable /* , UnauthorizedException */ } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async validate(/* params */): Promise<any> {
    /*
      if (!validate_condition) {
        throw new UnauthorizedException();
      } else {
        return some_info;
      }
    */
  }
}
