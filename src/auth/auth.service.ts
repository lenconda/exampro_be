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

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailerService: MailerService,
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
    return await this.userRepository.findOne({ email, active: true });
  }

  /**
   * active a user account
   * @param email email
   * @param code code
   */
  async active(email: string, code: string) {
    const user = await this.userRepository.findOne({ email, code });
    if (!user) {
      throw new ForbiddenException('无法识别当前账户');
    }
    if (user.active) {
      throw new BadRequestException('账户已激活，无需再次激活');
    }
    await this.userRepository.update({ email }, { code: '', active: true });
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
      throw new ForbiddenException('账户名或密码错误');
    }
    if (!result.active) {
      throw new ForbiddenException('在使用本服务前，请激活该账户');
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
    if (!email || !password) {
      throw new ForbiddenException('请将个人信息填写完整');
    }
    const user = this.userRepository.create({
      email,
      password: md5(password),
      avatar: '/assets/images/default_avatar.jpg',
      code: Math.floor(Math.random() * 1000000).toString(),
    });
    await this.mailerService.sendMail({
      to: email,
      from: 'no-reply@lenconda.top',
      subject: `【${apprc.name.toUpperCase()}】验证你的邮箱地址`,
      template: 'mail',
      context: {
        appName: apprc.name.toUpperCase(),
        mainContent: `在不久前，这个邮箱被用于注册 ${apprc.name.toUpperCase()} 服务。但是，到目前为止，我们仍无法信任这个邮箱。因此，我们需要你点击下面的链接完成邮箱的验证：`,
        linkHref: `${apprc.hostname}/user/active?m=${Buffer.from(
          user.email,
        ).toString('base64')}&c=${user.code}`,
        linkContent: '验证邮箱地址',
        placeholder: '',
      },
    });
    await this.userRepository.insert(user);
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
    const code = Math.floor(Math.random() * 1000000).toString();
    await this.mailerService.sendMail({
      to: email,
      from: 'no-reply@lenconda.top',
      subject: `【${apprc.name.toUpperCase()}】修改你的账户密码`,
      template: 'mail',
      context: {
        appName: apprc.name.toUpperCase(),
        mainContent: `在不久前，这个邮箱被绑定的 ${apprc.name} 账户发起忘记密码操作。因此，我们需要你点击下面的链接完成账户密码的重置：`,
        linkHref: `${apprc.hostname}/user/reset?m=${Buffer.from(email).toString(
          'base64',
        )}&c=${code}`,
        linkContent: '重置账户密码',
        placeholder: '',
      },
    });
    await this.userRepository.save({ ...userInfo, code });
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
      throw new ForbiddenException('无法识别当前用户');
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
