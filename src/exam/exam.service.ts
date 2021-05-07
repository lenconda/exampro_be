import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { AuthService } from 'src/auth/auth.service';
import {
  ERR_DUPLICATED_CONFIRMATION_PROHIBITED,
  ERR_NOT_PARTICIPANT,
} from 'src/constants';
import { MailService } from 'src/mail/mail.service';
import { PaperUser } from 'src/paper/paper_user.entity';
import { User } from 'src/user/user.entity';
import { snakeToCamel } from 'src/utils/objects';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { Exam } from './exam.entity';
import { ExamUser } from './exam_user.entity';
import moment from 'moment';

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
    const basicData = _.pick(info, [
      'title',
      'grades',
      'duration',
      'notify_participants',
      'public',
      'delay',
    ]);
    const startTime = info.start_time ? new Date(info.start_time) : null;
    const endTime = info.end_time ? new Date(info.end_time) : null;
    if (!endTime) {
      throw new BadRequestException();
    }
    const resultTime = info.result_time
      ? new Date(info.result_time)
      : moment(endTime).add(1, 'week').toDate();
    const exam = this.examRepository.create(
      snakeToCamel({
        ...basicData,
        startTime,
        endTime,
        resultTime,
      }),
    );
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

  async confirmExam(user: User, examId: number, confirmType: boolean) {
    const examUser = await this.examUserRepository.findOne({
      where: {
        user: {
          email: user.email,
        },
        exam: {
          id: examId,
        },
        role: {
          id: 'resource/exam/participant',
        },
      },
    });
    if (!examUser) {
      throw new ForbiddenException(ERR_NOT_PARTICIPANT);
    }
    if (!_.isNull(examUser.confirmed)) {
      throw new ForbiddenException(ERR_DUPLICATED_CONFIRMATION_PROHIBITED);
    }
    const confirmation = {
      confirmed: null,
    } as Partial<ExamUser>;
    confirmation.confirmed = confirmType;
    if (!_.isNull(confirmation.confirmed)) {
      await this.examUserRepository.update(
        {
          id: examUser.id,
        },
        confirmation,
      );
    }
  }

  async getExam(user: User, examId: number, roleId?: string) {
    const exam = await this.examRepository.findOne({ id: examId });
    if (exam.public) {
      return { exam };
    }
    const result = await this.examUserRepository.findOne({
      where: {
        user: {
          email: user.email,
        },
        exam: {
          id: examId,
        },
        ...(roleId
          ? {
              role: {
                id: roleId,
              },
            }
          : {}),
      },
      relations: ['exam', 'role', 'exam.paper'],
    });
    const examInitiator = await this.examUserRepository.findOne({
      where: {
        role: {
          id: 'resource/exam/initiator',
        },
        exam: {
          id: examId,
        },
      },
      relations: ['user'],
    });
    const { exam: examInfo = {}, role = {} } = result;
    return {
      ...examInfo,
      role,
      initiator: examInitiator.user,
      userExam: _.omit(result, ['exam', 'role']),
    };
  }

  async getExams(examIds: number[]) {
    return await this.examRepository.find({
      where: {
        id: In(examIds),
      },
    });
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
      if (updates.end_time && Boolean(updates.result_time)) {
        timeUpdates.resultTime = new Date(updates.result_time);
      }
      await this.examRepository.update(
        { id: examId },
        snakeToCamel({
          ..._.pick(updates, [
            'title',
            'grades',
            'duration',
            'notify_participants',
            'public',
            'delay',
          ]),
          ...timeUpdates,
        }),
      );
      return;
    }
  }

  async queryExams(
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    roleIds: string[],
    page,
    user: User = null,
  ) {
    const data = await queryWithPagination<number, Exam>(
      this.examRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        search,
        searchColumns: ['exams.title'],
        searchWithAlias: true,
        cursorColumn: 'exams.id',
        orderColumn: 'id',
        page,
        query: {
          join: {
            alias: 'exams',
            leftJoin: {
              users: 'exams.users',
            },
          },
          where: (qb: SelectQueryBuilder<ExamUser>) => {
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
            qb.andWhere('users.confirmed = 1');
            return '';
          },
          relations: ['paper'],
        },
      },
    );
    return data;
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
    const allowedTypes = [
      'maintainer',
      'participant',
      'invigilator',
      'reviewer',
    ];
    if (allowedTypes.indexOf(type) === -1 || emails.length === 0) {
      return {
        items: [],
        total: 0,
      };
    }

    const roleId = `resource/exam/${type}`;

    let emailsToBeInserted = [];
    let emailsToBeRegistered = [];
    let emailsToBeDeleted = [];

    const existedRelations = await this.examUserRepository.find({
      where: {
        exam: {
          id: examId,
        },
        role: {
          id: `resource/exam/${type}`,
        },
      },
      relations: ['user'],
    });
    const existedEmails = existedRelations.map(
      (relation) => relation.user.email,
    );
    const registeredUsers = await this.userRepository.find({
      where: {
        email: In(emails),
      },
    });
    emailsToBeRegistered = _.difference(
      emails,
      registeredUsers.map((user) => user.email),
    );
    emailsToBeInserted = _.difference(
      emails,
      emailsToBeRegistered,
      existedEmails,
    );
    emailsToBeDeleted = _.difference(existedEmails, emails);

    if (type === 'participant' && emailsToBeRegistered.length > 0) {
      await this.authService.register(emailsToBeRegistered, true);
      emailsToBeInserted = emailsToBeInserted.concat(emailsToBeRegistered);
    }

    if (emailsToBeInserted.length > 0) {
      const newRelations = emailsToBeInserted.map((email) => {
        return this.examUserRepository.create({
          user: {
            email,
          },
          role: {
            id: roleId,
          },
          exam: {
            id: examId,
          },
          // TODO: 目前写死，不支持确认邮件
          confirmed: true,
        });
      });
      await this.examUserRepository.save(newRelations);
    }

    if (emailsToBeDeleted.length > 0) {
      const relations = await this.examUserRepository.find({
        where: {
          exam: {
            id: examId,
          },
          user: {
            email: In(emailsToBeDeleted),
          },
          role: {
            id: roleId,
          },
        },
      });
      if (relations.length > 0) {
        await this.examUserRepository.delete(
          relations.map((relation) => relation.id),
        );
      }
    }

    return;
  }

  async queryExamUsers(
    examId: number,
    lastCursor: number,
    size: number,
    search: string,
    order: 'asc' | 'desc',
    type: string,
    page,
    relation = 'user',
    scope = 'all',
  ) {
    const allowedTypes = [
      'maintainer',
      'participant',
      'invigilator',
      'reviewer',
    ];
    if (allowedTypes.indexOf(type) === -1) {
      return {
        items: [],
        total: 0,
      };
    }
    const data = await queryWithPagination<number, ExamUser>(
      this.examUserRepository,
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
              exam: 'items.exam',
              user: 'items.user',
              role: 'items.role',
            },
          },
          where: (qb: SelectQueryBuilder<ExamUser>) => {
            qb.where('exam.id = :examId', { examId });
            qb.andWhere('role.id = :roleId', {
              roleId: `resource/exam/${type}`,
            });
            if (scope !== 'all') {
              qb.andWhere('items.reviewing = :value', {
                value: scope === 'unlocked_only' ? 0 : 1,
              });
            }
          },
          relations: ['user'],
        },
        page,
      },
    );
    const { items, total } = data;
    return {
      items: relation === 'user' ? items.map((item) => item.user) : items,
      total,
    };
  }

  async deleteExamUsers(examId: number, emails: string[], type: string) {
    const allowedTypes = [
      'maintainer',
      'participant',
      'invigilator',
      'reviewer',
    ];
    if (allowedTypes.indexOf(type) === -1) {
      return;
    }
    const roleId = `resource/exam/${type}`;
    const examUsers = await this.examUserRepository.find({
      exam: {
        id: examId,
      },
      role: {
        id: roleId,
      },
      user: {
        email: In(emails),
      },
    });
    if (examUsers.length > 0) {
      await this.examUserRepository.delete(
        examUsers.map((examUser) => examUser.id),
      );
    }
  }

  async updateParticipantLeftTimes(participant: User, examId: number) {
    const examUser = await this.examUserRepository.findOne({
      user: {
        email: participant.email,
      },
      exam: {
        id: examId,
      },
      role: {
        id: 'resource/exam/participant',
      },
    });
    if (examUser) {
      examUser.leftTimes = examUser.leftTimes + 1;
      await this.examUserRepository.save(examUser);
    }
  }

  async startExam(participant: User, examId: number) {
    const examUser = await this.examUserRepository.findOne({
      where: {
        exam: {
          id: examId,
        },
        user: {
          email: participant.email,
        },
        role: {
          id: 'resource/exam/participant',
        },
      },
      relations: ['exam'],
    });
    const { exam, submitTime } = examUser;
    const { startTime: examStartTime, endTime: examEndTime } = exam;
    const currentTime = new Date();
    const currentTimestamp = Date.parse(currentTime.toISOString());
    const examStartTimestamp = Date.parse(examStartTime.toISOString());
    const examEndTimestamp = Date.parse(examEndTime.toISOString());

    if (
      !examUser ||
      submitTime ||
      !(
        currentTimestamp >= examStartTimestamp &&
        currentTimestamp <= examEndTimestamp
      )
    ) {
      throw new ForbiddenException();
    }

    await this.examUserRepository.update(
      { id: examUser.id },
      {
        startTime: currentTime,
      },
    );

    return;
  }
}
