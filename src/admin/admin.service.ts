import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/role/user_role.entity';
import { User } from 'src/user/user.entity';
import { Repository } from 'typeorm';
import { Role } from 'src/role/role.entity';
import { queryWithPagination } from 'src/utils/pagination';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

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
}
