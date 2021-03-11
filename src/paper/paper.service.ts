import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Question } from 'src/question/question.entity';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository } from 'typeorm';
import { Paper } from './paper.entity';
import { PaperQuestion } from './paper_question.entity';
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
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(PaperQuestion)
    private readonly paperQuestionRepository: Repository<PaperQuestion>,
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

  async updatePaper(
    creator: User,
    paperId: number,
    updates: Record<string, any>,
  ) {
    if (
      await this.paperUserRepository.findOne({
        where: {
          user: {
            email: creator.email,
          },
          paper: {
            id: paperId,
          },
        },
      })
    ) {
      await this.paperRepository.update(
        { id: paperId },
        _.pick(updates, ['title', 'public']),
      );
    }
  }

  async getPaper(creator: User, paperId: number) {
    const data = await this.paperRepository.findOne({
      where: {
        id: paperId,
      },
      relations: ['users', 'users.user', 'users.role'],
    });
    const roles = data.users
      .filter((userRole) => userRole.user.email === creator.email)
      .map((userRole) => userRole.role);
    return _.merge(_.omit(data, ['users']), { roles });
  }

  async getPapers(
    creator: User,
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    roleIds: string[],
  ) {
    const data = await queryWithPagination<number, PaperUser>(
      this.paperUserRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        cursorColumn: 'paper.id',
        query: {
          where: {
            user: {
              email: creator.email,
            },
            role: {
              id: In(roleIds),
            },
          },
          relations: ['paper', 'role'],
        },
      },
    );
    return {
      items: data.items.map((item) =>
        _.merge(_.omit(item.paper, ['role']), { role: item.role }),
      ),
      total: data.total,
    };
  }

  async createPaperQuestion(
    paperId: number,
    questionId: number,
    order: number,
  ) {
    const paper = await this.paperRepository.findOne({ id: paperId });
    const question = await this.questionRepository.findOne({ id: questionId });

    if (
      !(await this.paperQuestionRepository.findOne({
        where: {
          paper: {
            id: paper.id,
          },
          question: {
            id: question.id,
          },
        },
      }))
    ) {
      await this.paperQuestionRepository.save(
        this.paperQuestionRepository.create({
          paper,
          question,
          order,
        }),
      );
    }

    return;
  }

  async deletePaperQuestions(paperId: number, questionIds: number[]) {
    const paperQuestions = await this.paperQuestionRepository.find({
      paper: {
        id: paperId,
      },
      question: {
        id: In(questionIds),
      },
    });
    await this.paperQuestionRepository.delete(
      paperQuestions.map((paperQuestion) => paperQuestion.id),
    );
  }

  async getPaperQuestions(paperId: number, answers: boolean) {
    const relations = ['question', 'question.choices'];
    if (answers) {
      relations.push('question.answers');
    }
    const paperQuestions = await this.paperQuestionRepository.find({
      where: {
        paper: {
          id: paperId,
        },
      },
      order: {
        'question.id': 'ASC',
      } as any,
      relations,
    });
    const items = paperQuestions.map((paperQuestion) => paperQuestion.question);
    return { items };
  }

  async createPaperMaintainers(paperId: number, maintainerEmails: string[]) {
    const existedMaintainerEmails = (
      await this.paperUserRepository.find({
        where: {
          paper: {
            id: paperId,
          },
          user: {
            email: In(maintainerEmails),
          },
          role: {
            id: 'resource/paper/maintainer',
          },
        },
        relations: ['user'],
      })
    ).map((maintainer) => maintainer.user.email);
    const maintainerEmailsToBeInserted = _.difference(
      maintainerEmails,
      existedMaintainerEmails,
    );
    if (maintainerEmailsToBeInserted.length > 0) {
      await this.paperUserRepository.save(
        maintainerEmailsToBeInserted.map((email) => {
          return this.paperUserRepository.create({
            user: { email },
            paper: {
              id: paperId,
            },
            role: {
              id: 'resource/paper/maintainer',
            },
          });
        }),
      );
    }
    return;
  }

  async deletePaperMaintainers(paperId: number, maintainerEmails: string[]) {
    const paperUsers = await this.paperUserRepository.find({
      where: {
        paper: {
          id: paperId,
        },
        user: {
          email: In(maintainerEmails),
        },
      },
    });
    if (paperUsers.length > 0) {
      await this.paperUserRepository.delete(
        paperUsers.map((paperUser) => paperUser.id),
      );
    }
  }

  async getPaperMaintainers(
    paperId: number,
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
  ) {
    const data = await queryWithPagination<number, PaperUser>(
      this.paperUserRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        cursorColumn: 'user.email',
        orderColumn: 'id',
        query: {
          where: {
            paper: {
              id: paperId,
            },
          },
          relations: ['user'],
        },
      },
    );
    return {
      items: data.items.map((item) => item.user),
      total: data.total,
    };
  }

  async transformOwnership(
    paperId: number,
    formerOwnerEmail: string,
    newOwnerEmail: string,
  ) {
    const formerOwnership = await this.paperUserRepository.findOne({
      where: {
        paper: {
          id: paperId,
        },
        user: {
          email: formerOwnerEmail,
        },
        role: {
          id: 'resource/paper/owner',
        },
      },
    });
    if (!formerOwnership) {
      throw new BadRequestException();
    }
    const existedFormerMaintainerShip = await this.paperUserRepository.findOne({
      where: {
        paper: {
          id: paperId,
        },
        user: {
          email: newOwnerEmail,
        },
        role: {
          id: 'resource/paper/maintainer',
        },
      },
      relations: ['role'],
    });
    if (existedFormerMaintainerShip) {
      existedFormerMaintainerShip.role.id = 'resource/paper/owner';
      await this.paperUserRepository.save(existedFormerMaintainerShip);
    } else {
      await this.paperUserRepository.save(
        this.paperUserRepository.create({
          user: {
            email: newOwnerEmail,
          },
          role: {
            id: 'resource/paper/owner',
          },
          paper: {
            id: paperId,
          },
        }),
      );
    }
    await this.paperUserRepository.update(
      {
        user: {
          email: formerOwnerEmail,
        },
      },
      {
        role: {
          id: 'resource/paper/maintainer',
        },
      },
    );
    return;
  }
}
