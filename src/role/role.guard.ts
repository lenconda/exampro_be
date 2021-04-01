import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';
import { ExamService } from 'src/exam/exam.service';
import { ExamUser } from 'src/exam/exam_user.entity';
import { PaperUser } from 'src/paper/paper_user.entity';
import { checkPatternMatchValues } from 'src/utils/checkers';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly examService: ExamService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const controllerRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    ); // 从控制器注解中得到的角色组信息。

    if (!controllerRoles || controllerRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    const getRequestResourceIds = (key: string): number[] => {
      let queryValue: any[] = _.get(request, `query.${key}`) || [];
      let paramsValue: any[] = _.get(request, `params.${key}`) || [];
      let bodyValue: any[] = _.get(request, `body.${key}`) || [];

      if (!_.isArray(queryValue)) {
        queryValue = [queryValue];
      }
      if (!_.isArray(paramsValue)) {
        paramsValue = [paramsValue];
      }
      if (!_.isArray(bodyValue)) {
        bodyValue = [bodyValue];
      }

      const result = _(
        []
          .concat(queryValue)
          .concat(paramsValue)
          .concat(bodyValue)
          .map((value) => {
            if (_.isNumber(value)) {
              return value;
            }
            return parseInt(value);
          }),
      )
        .reject(_.isNull)
        .reject(_.isUndefined)
        .reject(_.isNaN)
        .value();

      return _.uniq(result);
    };

    const participantChecker = (userExam: ExamUser) => {
      const userExamPaperBanned = _.get(userExam, 'exam.paper.banned');
      if (_.isBoolean(userExamPaperBanned) && userExamPaperBanned) {
        return false;
      }
      if (controllerRoles.indexOf(userExam.role.id) === -1) {
        return false;
      }
      if (userExam.role.id === 'resource/exam/participant') {
        const { startTime, delay } = userExam.exam;
        if (
          startTime &&
          startTime.getTime() &&
          Date.now() < startTime.getTime() + delay
        ) {
          return false;
        }
        if (userExam.confirmed) {
          return true;
        } else {
          return false;
        }
      }
      if (controllerRoles.indexOf(userExam.role.id) !== -1) {
        return true;
      } else {
        return false;
      }
    };

    const checkUserRole = () => {
      const roles = (user.roles
        ? user.roles.map((role) => role.id)
        : []) as string[];
      for (const controllerRole of controllerRoles) {
        if (checkPatternMatchValues(controllerRole, roles)) {
          return true;
        }
      }
      return false;
    };

    const checkExamRole = async () => {
      const examIds = getRequestResourceIds('exam').concat(
        getRequestResourceIds('exams'),
      );
      if (controllerRoles.indexOf('resource/exam/participant') !== -1) {
        const exams = await this.examService.getExams(examIds);
        const publicExams = exams.filter((exam) => exam.public);
        if (exams.length === publicExams.length && publicExams.length !== 0) {
          return true;
        }
      }
      if (examIds.length === 0) {
        return false;
      }
      const userExams = (user.exams || []) as ExamUser[];
      const matchedExamIds = userExams
        .filter(participantChecker)
        .map((userExam) => userExam.exam.id);
      for (const examId of examIds) {
        if (matchedExamIds.indexOf(examId) === -1) {
          return false;
        }
        return true;
      }
    };

    const checkPaperRole = () => {
      const userExams = (user.exams || []) as ExamUser[];
      const userPapers = (user.papers || []) as PaperUser[];
      const paperIds = getRequestResourceIds('paper').concat(
        getRequestResourceIds('papers'),
      );
      const matchedPaperIds = userPapers
        .filter((userPaper) => {
          return (
            controllerRoles.indexOf(userPaper.role.id) !== -1 &&
            !_.get(userPaper, 'paper.banned')
          );
        })
        .map((userPaper) => userPaper.paper.id)
        .concat(
          userExams
            .filter(participantChecker)
            .filter((userExam) => !_.get(userExam, 'exam.paper.banned'))
            .map((userExam) => _.get(userExam, 'exam.paper.id'))
            .filter((value) => value !== undefined),
        );
      if (paperIds.length === 0) {
        return false;
      }
      for (const paperId of paperIds) {
        if (matchedPaperIds.indexOf(paperId) === -1) {
          return false;
        }
        return true;
      }
    };

    const userRoleResult = checkUserRole();
    const examRoleResult = await checkExamRole();
    const paperRoleResult = checkPaperRole();

    return userRoleResult || examRoleResult || paperRoleResult;
  }
}
