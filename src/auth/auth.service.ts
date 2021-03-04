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
import { MailerService } from '@nestjs-modules/mailer';

import apprc from '../../.apprc';
import {
  ERR_ACCOUNT_NOT_FOUND,
  ERR_ACCOUNT_REPEATED_ACTIVATION_DETECTED,
  ERR_ACTIVE_CODE_EXPIRED,
  ERR_ACTIVE_CODE_INVALID,
  ERR_BODY_EMAIL_REQUIRED,
  ERR_BODY_PASSWORD_REQUIRED,
} from 'src/constants';
import { UserRole } from 'src/role/user_role.entity';
import { Role } from 'src/role/role.entity';
import { generateActiveCode } from 'src/utils/generators';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  /**
   * validate user
   * @param email email
   * @param password password
   */
  async validateUser(email: string, password: string) {
    return await this.userRepository.findOne({
      email,
      password: md5(password),
    });
  }

  /**
   * sign a token
   * @param email email
   */
  sign(email: string) {
    return this.jwtService.sign({ email });
  }

  /**
   * find a user
   * @param email email
   */
  async findUser(email: string) {
    return await this.userRepository.findOne({
      where: {
        email,
        active: true,
      },
      relations: ['role'],
    });
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
      token: this.sign(email),
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
      throw new ForbiddenException();
    }
    if (!result.active) {
      throw new ForbiddenException();
    }
    return {
      token: this.sign(email),
    };
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
    const code = generateActiveCode();
    const user = this.userRepository.create({
      email,
      password: md5(password),
      avatar: '/assets/images/default_avatar.jpg',
      code,
      activeExpire: new Date(Date.now() + apprc.security.activeCodeExpiration),
    });
    await this.mailerService.sendMail({
      to: email,
      from: 'no-reply@lenconda.top',
      subject: `[${apprc.name}] 验证你的邮箱地址`,
      template: 'mail',
      context: {
        appName: apprc.name,
        mainContent: `在不久前，这个邮箱被用于注册 ${
          apprc.name
        } 服务。但是，到目前为止，我们仍无法信任这个邮箱。因此，我们需要你点击下面的链接完成邮箱的验证。此链接仅在 ${Math.floor(
          apprc.security.activeCodeExpiration / 1000 / 60,
        )} 分钟内有效，请及时验证：`,
        linkHref: `${apprc.hostname}/user/active?m=${Buffer.from(
          user.email,
        ).toString('base64')}&c=${user.code}`,
        linkContent: '验证邮箱地址',
        placeholder: '',
      },
    });
    await this.userRepository.insert(user);
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
    const code = generateActiveCode();
    await this.mailerService.sendMail({
      to: email,
      from: 'no-reply@lenconda.top',
      subject: `[${apprc.name}]修改你的账户密码`,
      template: 'mail',
      context: {
        appName: apprc.name,
        mainContent: `在不久前，这个邮箱被绑定的 ${
          apprc.name
        } 账户发起忘记密码操作。因此，我们需要你点击下面的链接完成账户密码的重置。此链接仅在 ${Math.floor(
          apprc.security.activeCodeExpiration / 1000 / 60,
        )} 分钟内有效，请及时验证：`,
        linkHref: `${apprc.hostname}/user/reset?m=${Buffer.from(email).toString(
          'base64',
        )}&c=${code}`,
        linkContent: '重置账户密码',
        placeholder: '',
      },
    });
    await this.userRepository.save({
      ...userInfo,
      code,
      activeExpire: new Date(Date.now() + apprc.security.activeCodeExpiration),
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
