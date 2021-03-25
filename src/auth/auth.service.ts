import { ForbiddenException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import md5 from 'md5';
import {
  ERR_AUTHENTICATION_FAILED,
  ERR_EMAIL_VERIFICATION_REQUIRED,
  ERR_USER_BANNED,
  ERR_USER_PASSWORD_NOT_SET,
} from 'src/constants';
import { UserRole } from 'src/role/user_role.entity';
import { Role } from 'src/role/role.entity';
import { generateActiveCode } from 'src/utils/generators';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { MailService } from 'src/mail/mail.service';
import _ from 'lodash';

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

  async validateUser(email: string, password: string = null) {
    await this.checkUserBanStatus(email);

    const user = await this.userRepository.findOne({
      email,
      password: password ? md5(password) : null,
    });

    if (!user) {
      throw new ForbiddenException(ERR_AUTHENTICATION_FAILED);
    }

    if (_.isNull(password) && user) {
      throw new ForbiddenException(ERR_USER_PASSWORD_NOT_SET);
    }

    if (user.verifying) {
      throw new ForbiddenException(ERR_EMAIL_VERIFICATION_REQUIRED);
    }

    return user;
  }

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
    const exp = _.get(this.decode(token), 'exp') || currentTimestamp / 1000;
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

  async login(email: string, password: string = null) {
    const result = await this.validateUser(email, password);
    if (!result) {
      throw new ForbiddenException(ERR_AUTHENTICATION_FAILED);
    }
    return {
      token: this.sign(email),
    };
  }

  async logout(redirect: string) {
    return { redirect };
  }

  async register(emails: string[], notify = true) {
    const existedEmails = (
      await this.userRepository.find({
        where: { email: In(emails) },
      })
    ).map((user) => user.email);
    const insertedEmails = _.difference(emails, existedEmails);
    const items = insertedEmails.map((email) => {
      return {
        email,
        token: this.sign(email),
      };
    });
    const users = [];
    const userRoles = [];
    const role = await this.roleRepository.findOne({ id: 'user/normal' });
    for (const email of insertedEmails) {
      const code = generateActiveCode();
      const user = this.userRepository.create({
        email,
        code,
        avatar: '/assets/images/default_avatar.jpg',
      });
      users.push(user);
      userRoles.push(this.userRoleRepository.create({ user, role }));
    }
    if (notify) {
      await this.mailService.sendRegisterMail(items);
    }
    await this.userRepository.save(users);
    await this.userRoleRepository.save(userRoles);
    return;
  }

  async forgetPassword(email: string) {
    const userInfo = await this.userRepository.findOne({ email });
    if (!userInfo) {
      return {};
    }
    const token = this.sign(email);
    const code = generateActiveCode();
    await this.mailService.sendResetPasswordMail(email, token);
    await this.userRepository.save({
      ...userInfo,
      code,
      password: null,
    });
    return;
  }

  async resend(email: string, type: string) {
    const token = this.sign(email);
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['password'],
    });
    switch (type) {
      case 'register': {
        if (!user.password) {
          this.mailService.sendRegisterMail([{ email, token }]);
        }
        break;
      }
      case 'reset_password': {
        if (!user.password) {
          this.mailService.sendResetPasswordMail(email, token);
        }
        break;
      }
      case 'change_email': {
        if (user.verifying) {
          this.mailService.sendChangeEmailMail(email, token);
        }
        break;
      }
      default:
        break;
    }
    return;
  }

  async checkEmail(email: string) {
    if (await this.userRepository.findOne({ email })) {
      return {
        type: 'login',
      };
    } else {
      await this.register([email]);
      return {
        type: 'register',
      };
    }
  }
}
