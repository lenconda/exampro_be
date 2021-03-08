import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from './user.entity';
import md5 from 'md5';
import { Role } from 'src/role/role.entity';
import { UserRole } from 'src/role/user_role.entity';
import { queryWithPagination } from 'src/utils/pagination';
import _ from 'lodash';
import {
  ERR_ACCOUNT_NOT_FOUND,
  ERR_EMAIL_DUPLICATED,
  ERR_USER_INACTIVE,
} from 'src/constants';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';
import { generateActiveCode } from 'src/utils/generators';
import { MailService } from 'src/mail/mail.service';
import { ConfigService } from 'src/config/config.service';
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
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    this.redis = redisService.getClient();
  }

  private redis: Redis;

  async createAdminUser(email: string, password: string, roleIds: string[]) {
    const adminUser = this.userRepository.create({
      email,
      password: md5(password),
      active: true,
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

  async getUserList<T>(lastCursor: T, size = -1, order = 'asc') {
    return await queryWithPagination<T, User>(
      this.userRepository,
      lastCursor,
      'ASC',
      size,
      {
        cursorColumn: 'email',
        query: {
          order: {
            email: order.toUpperCase() as 'ASC' | 'DESC',
          },
        },
      },
    );
  }

  async getUserProfile(email: string) {
    const userInfo = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });

    if (!userInfo) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }

    if (!userInfo.active) {
      throw new ForbiddenException(ERR_USER_INACTIVE);
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
      throw new ForbiddenException(ERR_EMAIL_DUPLICATED);
    }
    const { hostname } = this.configService.get();
    const code = generateActiveCode();
    const link = `${hostname}/user/reset?m=${Buffer.from(email).toString(
      'base64',
    )}&c=${code}`;
    const { activeCodeExpiration } = this.configService.get('security');
    await this.userRepository.update(
      { email },
      {
        email: newEmail,
        active: false,
        code,
        activeExpire: new Date(Date.now() + activeCodeExpiration),
      },
    );
    await this.mailService.sendChangeEmailMail([newEmail], link);
    return {
      token: this.authService.sign(newEmail),
    };
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
}
