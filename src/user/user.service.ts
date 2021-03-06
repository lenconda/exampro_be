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
  ERR_USER_BANNED,
  ERR_USER_INACTIVE,
} from 'src/constants';
import { RedisService } from 'nestjs-redis';
import { Redis } from 'ioredis';

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
  ) {
    this.redis = redisService.getClient();
  }

  private redis: Redis;

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
    return await queryWithPagination<T>(this.userRepository, lastCursor, size, {
      cursorColumn: 'email',
      query: {
        order: {
          email: order.toUpperCase() as 'ASC' | 'DESC',
        },
      },
    });
  }

  async getUserProfile(email: string) {
    const userInfo = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });

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

  private async getUserBanStatus(email: string) {
    const key = `ban:user:${email}`;
    const banStatus = await this.redis.get(key);
    if (!banStatus) {
      return;
    }
    const ttl = await this.redis.ttl(key);
    return { banStatus, ttl };
  }

  async blockUser(email: string, type: string, days: number) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException(ERR_ACCOUNT_NOT_FOUND);
    }
    const key = `ban:user:${email}`;
    const userBlockRecord = (await this.getUserBanStatus(email)) || {
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

  async checkUserBanStatus(email: string) {
    const userBlockRecord = await this.getUserBanStatus(email);

    if (!userBlockRecord) {
      return;
    }

    const { banStatus, ttl } = userBlockRecord;

    const code = banStatus.split('\n').join(':');
    throw new ForbiddenException(`${ERR_USER_BANNED}::${code}::${ttl}`);
  }
}
