import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import { In, Repository } from 'typeorm';
import { Paper } from './paper.entity';
import { PaperUser } from './paper_user.entity';

@Injectable()
export class PaperService {
  constructor(
    @InjectRepository(Paper)
    private readonly paperRepository: Repository<Paper>,
    @InjectRepository(PaperUser)
    private readonly paperUserRepository: Repository<PaperUser>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async createPaper(creator: User, title: string, isPublic: boolean) {
    const paper = this.paperRepository.create({
      title,
      public: isPublic,
    });
    await this.paperRepository.save(paper);
    const paperUser = this.paperUserRepository.create({
      paper,
      user: creator,
      role: {
        id: 'resource/paper/owner',
      },
    });
    await this.paperUserRepository.save(paperUser);
    return paper;
  }

  async deletePapers(creator: User, paperIds: number[]) {
    const paperUsers = await this.paperUserRepository.find({
      where: {
        paper: {
          id: In(paperIds),
        },
        user: {
          email: creator.email,
        },
        role: {
          id: 'resource/paper/owner',
        },
      },
      relations: ['paper'],
    });
    const papers = paperUsers.map((paperUser) => paperUser.paper);
    await this.paperRepository.delete(papers.map((paper) => paper.id));
  }

  async getPaper(paperId: number) {
    return this.paperRepository.findOne({
      where: {
        id: paperId,
      },
      relations: ['users', 'users.role', 'users.user'],
    });
  }
}
