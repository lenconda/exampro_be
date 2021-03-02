import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from 'src/user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService /*
      @InjectRepository(User)
      private readonly userRepository: Repository<User>,
    */,
  ) {}

  /**
   * validate user
   */
  async validateUser(/* ...params */) {
    /*
      find a user info from db and return it
      e.g.

      return await this.userRepository.findOne({ ...params });
    */
  }

  /**
   * sign a token
   */
  sign(/* ...key */) {
    return this.jwtService.sign({
      /* key */
    });
  }

  /**
   * find a user
   */
  async findUser(/* ...params */) {
    /*
      find a user info from db and return it
      e.g.

      return await this.userRepository.findOne({ ...params });
    */
  }
}
