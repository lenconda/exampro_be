import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import _ from 'lodash';
import { User } from 'src/user/user.entity';
import { queryWithPagination } from 'src/utils/pagination';
import { In, Repository } from 'typeorm';
import { Report, ReportStatus } from './report.entity';
import { ReportType } from './report_type.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    @InjectRepository(ReportType)
    private readonly reportTypeRepository: Repository<ReportType>,
  ) {}

  async createReport(
    reporter: User,
    target: Record<string, any>,
    type: string,
  ) {
    const { user = null, exam = null, paper = null } = target;
    const targetInfo = {} as Partial<Report>;
    if (user) {
      _.set(targetInfo, 'user.email', user);
    }
    if (exam) {
      _.set(targetInfo, 'exam.id', exam);
    }
    if (paper) {
      _.set(targetInfo, 'paper.id', paper);
    }
    const report = this.reportRepository.create({
      reporter: {
        email: reporter.email,
      },
      ...targetInfo,
      type: {
        id: type,
      },
    });
    await this.reportRepository.save(report);
  }

  async queryReportedReports(
    lastCursor: number,
    size: number,
    order: 'asc' | 'desc',
    search: string,
    typeIds: string[] = [],
    reporter?: User,
  ) {
    const result = await queryWithPagination<number, Report>(
      this.reportRepository,
      lastCursor,
      order.toUpperCase() as 'ASC' | 'DESC',
      size,
      {
        search,
        searchColumns: ['user.email', 'user.name', 'paper.title', 'exam.title'],
        query: {
          where: {
            ...(reporter
              ? {
                  reporter: {
                    email: reporter.email,
                  },
                }
              : {}),
            ...(typeIds.length > 0
              ? {
                  type: In(typeIds),
                }
              : {}),
          },
          relations: ['user', 'paper', 'exam', 'reporter'],
        },
      },
    );
    return result;
  }

  async updateReportStatus(reportIds: number[], status: ReportStatus) {
    if (status !== 'denied' && status !== 'accepted') {
      return;
    }
    await this.reportRepository.update(
      { id: In(reportIds) },
      {
        status,
      },
    );
  }
}
