import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import md5 from 'md5';
import { Role } from 'src/role/role.entity';
import { UserRole } from 'src/role/user_role.entity';
import { queryWithPagination } from 'src/utils/pagination';
import _ from 'lodash';
import {
  ERR_ACCOUNT_NOT_FOUND,
  ERR_EMAIL_DUPLICATED,
  ERR_OLD_PASSWORD_MISMATCHED,
} from 'src/constants';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { generateActiveCode } from 'src/utils/generators';
import { MailService } from 'src/mail/mail.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {
    this.redis = redisService.getClient();
  }

  private redis: Redis;

  async createAdminUser(email: string, password: string, roleIds: string[]) {
    const adminUser = this.userRepository.create({
      email,
      password: md5(password),
    });
    const roles = await this.roleRepository.find({
      where: roleIds.map((roleId) => ({
        id: roleId,
      })),
    });
    const userRoles = roles.map((role) => ({
      role,
      user: adminUser,
    }));
    await this.userRepository.save(adminUser);
    await this.userRoleRepository.save(userRoles);
    return adminUser;
  }

  async queryUsers<T>(lastCursor: T, size = -1, order = 'asc', search = '') {
    return await queryWithPagination<T, User>(
      this.userRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        search,
        cursorColumn: 'email',
        searchColumns: ['email', 'name'],
      },
    );
  }

  async getUserProfile(email: string) {
    const userInfo = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
      select: ['email', 'avatar', 'password', 'name'],
    });

    if (!userInfo) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }

    const roles = ((userInfo.userRoles || []) as UserRole[]).map(
      (userRole: UserRole) => userRole.role,
    );

    return {
      ..._.omit(userInfo, ['userRoles']),
      roles,
    };
  }

  async updateUserProfile(email: string, data: Partial<User>) {
    return await this.userRepository.save({
      email,
      ..._.pick(data, ['avatar', 'name']),
    });
  }

  async updateUserPassword(
    user: User,
    oldPassword: string,
    newPassword: string,
  ) {
    if (user.password !== md5(oldPassword)) {
      throw new ForbiddenException(ERR_OLD_PASSWORD_MISMATCHED);
    }
    await this.userRepository.update(
      {
        email: user.email,
      },
      {
        password: md5(newPassword),
      },
    );
  }

  async blockUser(email: string, type: string, days: number) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }
    const key = `ban:user:${email}`;
    const userBlockRecord = (await this.authService.getUserBanStatus(
      email,
    )) || {
      ttl: 0,
    };
    const { ttl } = userBlockRecord;
    if (ttl === -1 || days === -1) {
      await this.redis.set(key, type);
    } else {
      await this.redis.set(key, type, 'EX', ttl + days * 86400);
    }
    return user;
  }

  async unblockUser(email: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }
    await this.redis.del(`ban:user:${email}`);
    return user;
  }

  async changeEmail(email: string, newEmail: string) {
    if (await this.userRepository.findOne({ email: newEmail })) {
      throw new BadRequestException(ERR_EMAIL_DUPLICATED);
    }
    const code = generateActiveCode();
    const token = this.authService.sign(newEmail);
    await this.userRepository.update(
      { email },
      {
        email: newEmail,
        code,
        verifying: true,
      },
    );
    await this.mailService.sendChangeEmailMail(newEmail, token);
    return {
      token: this.authService.sign(newEmail),
    };
  }

  async completeChangeEmail(email: string) {
    await this.userRepository.update(
      { email },
      {
        code: null,
        verifying: false,
      },
    );
  }

  async destroy(email: string) {
    const userInfo = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles'],
    });

    if (!userInfo) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }

    await this.userRepository.delete({ email });

    return;
  }

  async complete(email: string, info: Record<string, any>) {
    const userInfo = await this.userRepository.findOne({
      where: { email },
    });
    if (!userInfo) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }
    await this.userRepository.update(
      { email },
      {
        ..._.pick(info, ['password', 'avatar', 'name']),
        code: null,
        verifying: false,
      },
    );
  }

  async completeRegistration(email: string, name: string, password: string) {
    await this.complete(email, {
      name,
      password: md5(password),
    });
  }

  async completeForgetPassword(email: string, password: string) {
    await this.complete(email, {
      password: md5(password),
    });
    return;
  }
}
