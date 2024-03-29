import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { Question } from 'src/question/question.entity';
import { Role } from 'src/role/role.entity';
import { User } from 'src/user/user.entity';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Paper } from './paper.entity';
import { PaperQuestion } from './paper_question.entity';
import { PaperUser } from './paper_user.entity';

export interface QuestionData {
  id: number;
  points: number;
}

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createPaper(
    creator: User,
    title: string,
    isPublic: boolean,
    missedChoicesScore: number,
  ) {
    const paper = this.paperRepository.create({
      title,
      public: isPublic,
      missedChoicesScore,
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
      const currentUpdates = _.pick(updates, [
        'title',
        'public',
        'missedChoicesScore',
      ]);
      await this.paperRepository.update(
        { id: paperId },
        Object.keys(currentUpdates).reduce((result, currentKey) => {
          result[_.camelCase(currentKey)] = currentUpdates[currentKey];
          return result;
        }, {}),
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
    const role = data.users
      .filter((userRole) => userRole.user.email === creator.email)
      .map((userRole) => userRole.role)[0];
    return _.merge(_.omit(data, ['users']), {
      role,
      creator: _.get(
        _.first(
          data.users.filter(
            (userRole) => userRole.role.id === 'resource/paper/owner',
          ),
        ),
        'user',
      ),
    });
  }

  async queryPapers(
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    roleIds: string[],
    page,
    user: User = null,
  ) {
    const data = await queryWithPagination<number, Paper>(
      this.paperRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        cursorColumn: 'papers.id',
        orderColumn: 'id',
        search,
        searchColumns: ['title'],
        searchWithAlias: true,
        page,
        query: {
          join: {
            alias: 'papers',
            leftJoin: {
              users: 'papers.users',
            },
          },
          where: (qb: SelectQueryBuilder<Paper>) => {
            if (user) {
              qb.andWhere('users.user.email = :email', {
                email: user.email,
              });
            }
            if (roleIds.length > 0) {
              qb.andWhere('users.role.id IN (:roleIds)', {
                roleIds,
              });
            }
            return '';
          },
          relations: ['users', 'users.role', 'users.user'],
        },
      },
    );
    return {
      items: data.items.map((item) => {
        return {
          ..._.omit(item, ['users']),
          creator: _.get(
            _.first(
              item.users.filter(
                (userRole) => userRole.role.id === 'resource/paper/owner',
              ),
            ),
            'user',
          ),
          role: _.get(
            _.first(
              item.users.filter(
                (userRole) => userRole.user.email === user.email,
              ),
            ),
            'role',
          ),
        };
      }),
      total: data.total,
    };
  }

  async createPaperQuestion(
    paperId: number,
    questionDataItems: QuestionData[],
  ) {
    const getPoints = (id: number) => {
      const item = questionDataItems.find((item) => item.id === id);
      if (item) {
        return item.points || 0;
      } else {
        return 0;
      }
    };

    const paper = await this.paperRepository.findOne({ id: paperId });

    const existedPaperQuestions = await this.paperQuestionRepository.find({
      where: {
        paper: {
          id: paperId,
        },
      },
    });

    if (existedPaperQuestions.length > 0) {
      await this.paperQuestionRepository.delete(
        existedPaperQuestions.map((relation) => relation.id),
      );
    }

    const newRelations = questionDataItems.map((question, index) => {
      return this.paperQuestionRepository.create({
        paper,
        question: {
          id: question.id,
        },
        order: index + 1,
        points: getPoints(question.id),
      });
    });

    if (newRelations.length > 0) {
      await this.paperQuestionRepository.save(newRelations);
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
    const relations = [
      'question',
      'question.creator',
      'question.choices',
      'question.answers',
    ];
    const paperQuestions = await this.paperQuestionRepository.find({
      where: {
        paper: {
          id: paperId,
        },
      },
      order: {
        order: 'ASC',
      } as any,
      relations,
    });
    const items = paperQuestions.map((paperQuestion) => {
      const question = {
        ...paperQuestion.question,
        ...(paperQuestion.question.type === 'fill_in_blank'
          ? {
              blankCount: paperQuestion.question.answers.length,
            }
          : {}),
      };
      const data = {
        ...paperQuestion,
        question,
      };
      return answers ? data : _.omit(data, ['question.answers']);
    });
    return { items };
  }

  async createPaperMaintainers(
    creator: User,
    paperId: number,
    maintainerEmails: string[],
  ) {
    const existedRelations = await this.paperUserRepository.find({
      where: {
        paper: {
          id: paperId,
        },
        role: {
          id: 'resource/paper/maintainer',
        },
      },
    });

    if (existedRelations.length > 0) {
      await this.paperUserRepository.delete(
        existedRelations.map((relation) => relation.id),
      );
    }

    const maintainers = await this.userRepository.find({
      where: {
        email: In(maintainerEmails),
      },
    });

    const newRelations = maintainers
      .filter((maintainer) => {
        return maintainer.email !== creator.email;
      })
      .map((maintainer) => {
        return this.paperUserRepository.create({
          user: maintainer,
          paper: {
            id: paperId,
          },
          role: {
            id: 'resource/paper/maintainer',
          },
        });
      });

    if (newRelations.length > 0) {
      await this.paperUserRepository.save(newRelations);
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

  async queryPaperMaintainers(
    paperId: number,
    lastCursor: number,
    size: number,
    search: string,
    order: 'asc' | 'desc',
    page,
  ) {
    const data = await queryWithPagination<number, PaperUser>(
      this.paperUserRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        cursorColumn: 'id',
        search,
        searchColumns: ['user.email', 'user.name'],
        searchWithAlias: true,
        query: {
          join: {
            alias: 'items',
            leftJoin: {
              paper: 'items.paper',
              user: 'items.user',
              role: 'items.role',
            },
          },
          where: (qb: SelectQueryBuilder<Paper>) => {
            qb.where('paper.id = :paperId', { paperId });
            qb.andWhere('role.id = :roleId', {
              roleId: 'resource/paper/maintainer',
            });
          },
          relations: ['user'],
        },
        page,
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

  async blockPaper(paperIds: number[]) {
    await this.paperRepository.update({ id: In(paperIds) }, { banned: true });
  }

  async unblockPaper(paperIds: number[]) {
    await this.paperRepository.update({ id: In(paperIds) }, { banned: false });
  }
}
