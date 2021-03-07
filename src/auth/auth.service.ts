import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import md5 from 'md5';
import {
  ERR_ACCOUNT_NOT_FOUND,
  ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED,
  ERR_ACTIVE_CODE_EXPIRED,
  ERR_ACTIVE_CODE_INVALID,
  ERR_AUTHENTICATION_FAILED,
  ERR_BODY_EMAIL_REQUIRED,
  ERR_BODY_PASSWORD_REQUIRED,
  ERR_USER_BANNED,
  ERR_USER_INACTIVE,
} from 'src/constants';
import { UserRole } from 'src/role/user_role.entity';
import { Role } from 'src/role/role.entity';
import { generateActiveCode } from 'src/utils/generators';
import { ConfigService } from 'src/config/config.service';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.redis = redisService.getClient();
  }

  private redis: Redis;

  async getUserBanStatus(email: string) {
    const key = `ban:user:${email}`;
    const banStatus = await this.redis.get(key);
    if (!banStatus) {
      return;
    }
    const ttl = await this.redis.ttl(key);
    return { banStatus, ttl };
  }

  async checkUserBanStatus(email: string) {
    const userBlockRecord = await this.getUserBanStatus(email);

    if (!userBlockRecord) {
      return;
    }

    const { banStatus, ttl } = userBlockRecord;

    const code = banStatus.split('\n').join(':');
    throw new ForbiddenException(`${ERR_USER_BANNED}::${code}::${ttl}`);
  }

  /**
   * validate user
   * @param email email
   * @param password password
   */
  async validateUser(email: string, password: string) {
    await this.checkUserBanStatus(email);

    const user = await this.userRepository.findOne({
      email,
      password: md5(password),
    });

    return user;
  }

  /**
   * sign a token
   * @param email email
   */
  sign(email: string) {
    return this.jwtService.sign({ email });
  }

  decode(token: string): Record<string, any> {
    return this.jwtService.decode(token) as Record<string, any>;
  }

  async checkToken(token: string) {
    const existence = await this.redis.exists(`token:${token}`);
    return Boolean(existence);
  }

  async blockToken(token: string) {
    const currentTimestamp = Date.now();
    const { exp = currentTimestamp / 1000 } = this.decode(token);
    const expirationTimestamp = exp * 1000;
    if (expirationTimestamp <= currentTimestamp) {
      return;
    }
    await this.redis.set(
      `token:${token}`,
      new Date().toISOString(),
      'EX',
      Math.round((expirationTimestamp - currentTimestamp) / 1000 + 86400),
    );
  }

  /**
   * active a user account
   * @param email email
   * @param code code
   */
  async active(email: string, code: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['activeExpire', 'active', 'code'],
    });
    if (!user) {
      throw new ForbiddenException(ERR_ACCOUNT_NOT_FOUND);
    }
    if (user.active) {
      throw new BadRequestException(ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED);
    }
    if (Date.now() > user.activeExpire.getTime()) {
      throw new ForbiddenException(ERR_ACTIVE_CODE_EXPIRED);
    }
    if (user.code !== code) {
      throw new ForbiddenException(ERR_ACTIVE_CODE_INVALID);
    }
    await this.userRepository.update(
      { email },
      { code: null, active: true, activeExpire: null },
    );
    return {
      message: 'OK',
    };
  }

  /**
   * login
   * @param email email
   * @param password password
   */
  async login(email: string, password: string) {
    const result = await this.validateUser(email, password);
    if (!result) {
      throw new ForbiddenException(ERR_AUTHENTICATION_FAILED);
    }
    if (!result.active) {
      throw new ForbiddenException(ERR_USER_INACTIVE);
    }
    return {
      token: this.sign(email),
    };
  }

  async logout(redirect: string) {
    return { redirect };
  }

  async createUser(email: string, password: string, code: string, exp: number) {
    const user = this.userRepository.create({
      email,
      password: md5(password),
      avatar: '/assets/images/default_avatar.jpg',
      code,
      activeExpire: new Date(Date.now() + exp),
    });
    await this.userRepository.insert(user);
    return user;
  }

  /**
   * register
   * @param email email
   * @param password password
   */
  async register(email: string, password: string) {
    if (!email) {
      throw new ForbiddenException(ERR_BODY_EMAIL_REQUIRED);
    }
    if (!password) {
      throw new ForbiddenException(ERR_BODY_PASSWORD_REQUIRED);
    }
    const { activeCodeExpiration } = this.configService.get('security') as {
      activeCodeExpiration: number;
    };
    const { hostname } = this.configService.get();
    const code = generateActiveCode();
    const link = `${hostname}/user/active?m=${Buffer.from(email).toString(
      'base64',
    )}&c=${code}`;
    await this.mailService.sendRegisterMail([email], link);
    const user = await this.createUser(
      email,
      password,
      code,
      activeCodeExpiration,
    );
    const role = await this.roleRepository.findOne({ id: 'user/normal' });
    const userRole = this.userRoleRepository.create({ user, role });
    await this.userRoleRepository.save(userRole);
    return {
      token: this.sign(email),
    };
  }

  /**
   * forget password
   * @param email email
   */
  async forgetPassword(email: string) {
    const userInfo = await this.userRepository.findOne({ email });
    if (!userInfo) {
      return {};
    }
    const { hostname } = this.configService.get();
    const { activeCodeExpiration } = this.configService.get('security') as {
      activeCodeExpiration: number;
    };
    const code = generateActiveCode();
    const link = `${hostname}/user/reset?m=${Buffer.from(email).toString(
      'base64',
    )}&c=${code}`;
    await this.mailService.sendResetPasswordMail([email], link);
    await this.userRepository.save({
      ...userInfo,
      code,
      activeExpire: new Date(Date.now() + activeCodeExpiration),
    });
    return {};
  }

  /**
   * reset password
   * @param email
   * @param code string
   * @param password string
   */
  async resetPassword(email: string, code: string, password: string) {
    const userInfo = await this.userRepository.findOne({
      email,
      code,
    });
    if (!userInfo) {
      throw new ForbiddenException();
    }
    const newUserInfo: User = {
      ...userInfo,
      password: md5(password),
      code: '',
    };
    await this.userRepository.save(newUserInfo);
    return {
      token: this.sign(email),
    };
  }
}
