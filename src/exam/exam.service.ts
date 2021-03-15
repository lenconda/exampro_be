import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { AuthService } from 'src/auth/auth.service';
import { MailService } from 'src/mail/mail.service';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamUser } from './exam_user.entity';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(ExamUser)
    private readonly examUserRepository: Repository<ExamUser>,
    @InjectRepository(PaperUser)
    private readonly paperUserRepository: Repository<PaperUser>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
    private readonly mailService: MailService,
  ) {}

  async createExam(creator: User, info: Record<string, any>) {
    const basicData = _.pick(info, ['title', 'grades', 'duration']);
    const startTime = info.start_time ? new Date(info.start_time) : null;
    const endTime = info.end_time ? new Date(info.end_time) : null;
    const exam = this.examRepository.create({
      ...basicData,
      startTime,
      endTime,
    });
    await this.examRepository.save(exam);
    const examUser = this.examUserRepository.create({
      exam: {
        id: exam.id,
      },
      user: {
        email: creator.email,
      },
      role: {
        id: 'resource/exam/initiator',
      },
    });
    await this.examUserRepository.save(examUser);
    return exam;
  }

  async createExamPaper(creator: User, examId: number, paperId: number) {
    const paperUser = await this.paperUserRepository.findOne({
      where: {
        paper: {
          id: paperId,
        },
        user: {
          email: creator.email,
        },
      },
      relations: ['paper'],
    });
    const exam = await this.examRepository.findOne({
      where: { id: examId },
    });
    if (paperUser && exam) {
      await this.examRepository.update(
        { id: examId },
        {
          paper: paperUser.paper,
        },
      );
    }
  }

  async deleteExams(creator: User, examIds: number[]) {
    const examUsers = await this.examUserRepository.find({
      where: {
        user: {
          email: creator.email,
        },
        exam: {
          id: In(examIds),
        },
        role: {
          id: 'resource/exam/initiator',
        },
      },
      relations: ['exam'],
    });
    const examIdsToBeDeleted = examUsers.map((examUser) => examUser.exam.id);
    await this.examRepository.delete(examIdsToBeDeleted);
    return;
  }

  async updateExam(
    creator: User,
    examId: number,
    updates: Record<string, any>,
  ) {
    const examUser = await this.examUserRepository.findOne({
      user: {
        email: creator.email,
      },
      exam: {
        id: examId,
      },
      role: {
        id: In(['resource/exam/initiator', 'resource/exam/maintainer']),
      },
    });
    if (examUser) {
      const timeUpdates = {} as Partial<Exam>;
      if (updates.start_time || _.isNull(updates.start_time)) {
        timeUpdates.startTime = updates.start_time
          ? new Date(updates.start_time)
          : null;
      }
      if (updates.end_time && Boolean(updates.end_time)) {
        timeUpdates.endTime = new Date(updates.end_time);
      }
      await this.examRepository.update(
        { id: examId },
        {
          ..._.pick(updates, ['title', 'grades', 'duration']),
          ...timeUpdates,
        },
      );
      return;
    }
  }

  async queryExams(
    creator: User,
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    roleIds: string[],
  ) {
    const data = await queryWithPagination<number, ExamUser>(
      this.examUserRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        cursorColumn: 'exam.id',
        search,
        searchColumns: ['exam.title'],
        query: {
          join: {
            alias: 'items',
            leftJoin: {
              exam: 'items.exam',
              user: 'items.user',
              role: 'items.role',
            },
          },
          where: (qb: SelectQueryBuilder<ExamUser>) => {
            qb.andWhere('user.email = :email', {
              email: creator.email,
            });
            if (roleIds.length > 0) {
              qb.andWhere('role.id IN (:roleIds)', {
                roleIds,
              });
            }
            return '';
          },
          relations: ['exam', 'role'],
        },
      },
    );
    return {
      items: data.items.map((item) =>
        _.merge(_.omit(item.exam, ['role']), { role: item.role }),
      ),
      total: data.total,
    };
  }

  async transformOwnership(
    examId: number,
    formerOwnerEmail: string,
    newOwnerEmail: string,
  ) {
    const formerOwnership = await this.examUserRepository.findOne({
      where: {
        exam: {
          id: examId,
        },
        user: {
          email: formerOwnerEmail,
        },
        role: {
          id: 'resource/exam/initiator',
        },
      },
    });
    if (!formerOwnership) {
      throw new BadRequestException();
    }
    const existedFormerMaintainerShip = await this.examUserRepository.findOne({
      where: {
        exam: {
          id: examId,
        },
        user: {
          email: newOwnerEmail,
        },
        role: {
          id: 'resource/exam/maintainer',
        },
      },
      relations: ['role'],
    });
    if (existedFormerMaintainerShip) {
      existedFormerMaintainerShip.role.id = 'resource/exam/initiator';
      await this.examUserRepository.save(existedFormerMaintainerShip);
    } else {
      await this.examUserRepository.save(
        this.examUserRepository.create({
          user: {
            email: newOwnerEmail,
          },
          role: {
            id: 'resource/exam/initiator',
          },
          exam: {
            id: examId,
          },
        }),
      );
    }
    await this.examUserRepository.update(
      {
        user: {
          email: formerOwnerEmail,
        },
      },
      {
        role: {
          id: 'resource/exam/maintainer',
        },
      },
    );
    return;
  }

  async createExamUsers(examId: number, emails: string[], type: string) {
    const allowedTypes = ['maintainer', 'participant', 'invigilator'];
    if (allowedTypes.indexOf(type) === -1) {
      return;
    }
    const roleId = `resource/exam/${type}`;
    const registeredUserEmails = (
      await this.userRepository.find({
        where: {
          email: In(emails),
        },
      })
    ).map((user) => user.email);
    const existedEmails = (
      await this.examUserRepository.find({
        where: {
          exam: {
            id: examId,
          },
          user: {
            email: In(emails),
          },
          role: {
            id:
              type === 'participant'
                ? In(allowedTypes.map((type) => `resource/exam/${type}`))
                : roleId,
          },
        },
        relations: ['user'],
      })
    ).map((maintainer) => maintainer.user.email);

    let insertedEmails = [];
    let unregisteredEmails = [];

    if (type !== 'participant') {
      insertedEmails = _.difference(registeredUserEmails, existedEmails);
    } else {
      insertedEmails = _.difference(emails, existedEmails);
      unregisteredEmails = _.difference(insertedEmails, registeredUserEmails);
      await this.authService.register(unregisteredEmails, false);
      const exam = await this.examRepository.findOne({
        where: {
          id: examId,
        },
      });
      if (exam.notifyParticipants || exam.public) {
        const items = insertedEmails.map((email) => ({
          email,
          exam,
          ...(unregisteredEmails.indexOf(email) !== -1
            ? {
                token: this.authService.sign(email),
              }
            : {}),
        }));
        await this.mailService.sendExamConfirmationMail(items);
      }
    }
    if (insertedEmails.length > 0) {
      await this.examUserRepository.save(
        insertedEmails.map((email) => {
          return this.examUserRepository.create({
            user: { email },
            exam: {
              id: examId,
            },
            role: {
              id: roleId,
            },
          });
        }),
      );
    }
    return;
  }
}
