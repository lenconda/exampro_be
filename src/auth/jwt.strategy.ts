import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { UserService } from 'src/user/user.service';
import _ from 'lodash';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    const result = await this.userService.getUserProfile(payload.email, [
      'papers',
      'papers.role',
      'papers.paper',
      'exams',
      'exams.role',
      'exams.exam',
      'exams.exam.paper',
    ]);
    if (!result) {
      return null;
    }
    return _.omit(result);
  }
}
