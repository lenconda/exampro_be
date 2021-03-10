import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paper } from './paper.entity';

@Injectable()
export class PaperService {
  constructor(
    @InjectRepository(Paper)
    private readonly paperRepository: Repository<Paper>,
  ) {}

  async getPaper(paperId: number) {
    return this.paperRepository.findOne({
      where: {
        id: paperId,
      },
      relations: ['users', 'users.role', 'users.user'],
    });
  }
}
