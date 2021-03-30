import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/role/role.guard';
import { CurrentUser } from 'src/user/user.decorator';
import { User } from 'src/user/user.entity';
import { ReportService } from './report.service';

@Controller('/api/report')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  async createReport(
    @CurrentUser() reporter: User,
    @Body('target') target: Record<string, any>,
    @Body('type') type: string,
  ) {
    return await this.reportService.createReport(reporter, target, type);
  }

  @Get()
  async queryReportedReports(
    @CurrentUser() reporter: User,
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = 10,
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('types') types = '',
    @Query('page') page = '0',
  ) {
    const typeIds = types ? types.split(',') : [];
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.reportService.queryReportedReports(
      cursor,
      size,
      order,
      search,
      typeIds,
      parseInt(page),
      reporter,
    );
  }
}
