import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import _ from 'lodash';
import { ExamUser } from 'src/exam/exam_user.entity';
import { PaperUser } from 'src/paper/paper_user.entity';
import { checkPatternMatchValues } from 'src/utils/checkers';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

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

    const checkExamRole = () => {
      const examIds = getRequestResourceIds('exam').concat(
        getRequestResourceIds('exams'),
      );
      const userExams = (user.exams || []) as ExamUser[];
      const matchedExamIds = userExams
        .filter((userExam) => {
          return controllerRoles.indexOf(userExam.role.id) !== -1;
        })
        .map((userExam) => userExam.exam.id);
      if (examIds.length === 0) {
        return false;
      }
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
          return controllerRoles.indexOf(userPaper.role.id) !== -1;
        })
        .map((userPaper) => userPaper.paper.id)
        .concat(
          userExams
            .filter((userExam) => {
              return (
                userExam.exam.paper &&
                (userExam.role.id === 'resource/exam/participant'
                  ? Boolean(userExam.confirmed)
                  : false) &&
                controllerRoles.indexOf(userExam.role.id) !== -1
              );
            })
            .map((userExam) => userExam.exam.paper.id),
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

    return checkUserRole() || checkExamRole() || checkPaperRole();
  }
}
