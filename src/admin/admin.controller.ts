import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import _ from 'lodash';
import { ExamService } from 'src/exam/exam.service';
import { MenuService } from 'src/menu/menu.service';
import { PaperService } from 'src/paper/paper.service';
import { ReportStatus } from 'src/report/report.entity';
import { ReportService } from 'src/report/report.service';
import { Role } from 'src/role/role.decorator';
import { RoleGuard } from 'src/role/role.guard';
import { RoleService } from 'src/role/role.service';
import { UserService } from 'src/user/user.service';

@Controller('/api/admin')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly menuService: MenuService,
    private readonly roleService: RoleService,
    private readonly reportService: ReportService,
    private readonly paperService: PaperService,
    private readonly examService: ExamService,
  ) {}

  @Post()
  @Role('user/admin/system', 'user/admin/user')
  async createAdmin(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('roles') roles: string[] = [],
  ) {
    return await this.userService.createAdminUser(email, password, roles);
  }

  @Get('/user')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/role')
  async queryUsers(
    @Query('last_cursor') lastCursor = null,
    @Query('page') page = '0',
    @Query('search') search = '',
    @Query('size') size = 10,
    @Query('order') order = 'asc',
  ) {
    return await this.userService.queryUsers<string>(
      lastCursor,
      size,
      order,
      search,
      parseInt(page),
    );
  }

  @Get('/user/:email')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/role')
  async getUserProfile(@Param('email') email: string) {
    return _.omit(await this.userService.getUserProfile(email), ['password']);
  }

  @Put('/user/:email/block')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/report')
  async blockUser(
    @Param('email') email: string,
    @Body('type') type: string,
    @Body('days') days = -1,
  ) {
    return await this.userService.blockUser(email, type, days);
  }

  @Delete('/user/:email/block')
  @Role('user/admin/system', 'user/admin/user', 'user/admin/report')
  async unblockUser(@Param('email') email: string) {
    return await this.userService.unblockUser(email);
  }

  @Get('/menu')
  @Role('user/admin/system', 'user/admin/layout', 'user/admin/role')
  async queryMenu(
    @Query('last_cursor') lastCursor = '0',
    @Query('size') size = '-1',
    @Query('page') page = '0',
    @Query('role') roleId: string,
    @Query('order') order: 'asc' | 'desc' = 'asc',
  ) {
    return await this.menuService.queryMenu(
      parseInt(lastCursor),
      parseInt(size),
      order,
      roleId,
      parseInt(page),
    );
  }

  @Post('/menu')
  @Role('user/admin/system', 'user/admin/layout')
  async createMenuItem(
    @Body('title') title: string,
    @Body('pathname') pathname: string,
    @Body('icon') icon: string,
    @Body('parent') parent: number,
    @Body('roles') roles: string[],
    @Body('order') order: number,
  ) {
    return await this.menuService.createMenuItem(
      title,
      pathname,
      icon,
      parent,
      order,
      roles,
    );
  }

  @Patch('/menu/:id')
  @Role('user/admin/system', 'user/admin/layout')
  async updateMenu(
    @Body() updates: Record<string, any>,
    @Param('id') id: string,
  ) {
    return await this.menuService.updateMenu(parseInt(id, 10), updates);
  }

  @Delete('/menu')
  @Role('user/admin/system', 'user/admin/layout')
  async deleteMenus(@Body('id') ids: number[]) {
    return await this.menuService.deleteMenus(ids);
  }

  @Delete('/menu/:id')
  @Role('user/admin/system', 'user/admin/layout')
  async deleteOneMenu(@Param('id') id: string) {
    return await this.menuService.deleteMenus([parseInt(id, 10)]);
  }

  @Post('/role')
  @Role('user/admin/system', 'user/admin/role')
  async createRole(
    @Body('id') id: string,
    @Body('description') description: string = null,
    @Body('order') order = 1,
  ) {
    return await this.roleService.createRole(id, description, order);
  }

  @Get('/role')
  @Role('user/admin/system', 'user/admin/role')
  async getRoles(@Query('flatten') flatten = false) {
    if (flatten) {
      return await this.roleService.getFlattenedRoles();
    } else {
      return await this.roleService.getTreedRoles();
    }
  }

  @Post('/role/user')
  @Role('user/admin/system', 'user/admin/role')
  async grantUserRoles(
    @Body('users') userEmails: string[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.grantUserRoles(userEmails, roleIds);
  }

  @Delete('/role/user')
  @Role('user/admin/system', 'user/admin/role')
  async revokeUserRoles(
    @Body('users') userEmails: string[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.revokeUserRoles(userEmails, roleIds);
  }

  @Get('/role/:role/user')
  @Role('user/admin/system', 'user/admin/role')
  async queryRoleUsers(
    @Param('role') roleId: string,
    @Query('last_cursor') lastCursor = null,
    @Query('size') size = 10,
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '0',
  ) {
    return await this.roleService.queryRoleUsers(
      lastCursor,
      size,
      order,
      search,
      roleId,
      parseInt(page),
    );
  }

  @Post('/role/menu')
  @Role('user/admin/system', 'user/admin/role')
  async grantMenuRoles(
    @Body('menus') menuIds: number[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.grantMenuRoles(menuIds, roleIds);
  }

  @Delete('/role/menu')
  @Role('user/admin/system', 'user/admin/role')
  async revokeMenuRoles(
    @Body('menus') menuIds: number[] = [],
    @Body('roles') roleIds: string[] = [],
  ) {
    return await this.roleService.revokeMenuRoles(menuIds, roleIds);
  }

  @Get('/role/:role/menu')
  @Role('user/admin/system', 'user/admin/role')
  async queryRoleMenus(
    @Param('role') roleId: string,
    @Query('last_cursor') lastCursor = null,
    @Query('size') size = 10,
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '0',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.roleService.queryRoleMenus(
      cursor,
      size,
      order,
      search,
      roleId,
      parseInt(page),
    );
  }

  @Get('/menu/:menu/role')
  @Role('user/admin/system', 'user/admin/layout')
  async queryMenuRoles(
    @Param('menu') menuId: number,
    @Query('last_cursor') lastCursor = null,
    @Query('size') size = 10,
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'asc',
    @Query('page') page = '0',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.menuService.queryMenuRoles(
      cursor,
      size,
      order,
      search,
      menuId,
      parseInt(page),
    );
  }

  @Patch('/role/:id')
  @Role('user/admin/system', 'user/admin/role')
  async updateRole(@Param('id') id: string, @Body() updates = {}) {
    return await this.roleService.updateRole(id, updates);
  }

  @Delete('/role/:id')
  @Role('user/admin/system', 'user/admin/role')
  async deleteRole(@Param('id') id: string) {
    return await this.roleService.deleteRoles(id);
  }

  @Delete('/role')
  @Role('user/admin/system', 'user/admin/role')
  async deleteRoles(@Body('id') id = '') {
    return await this.roleService.deleteRoles(id);
  }

  @Get('/report')
  @Role('user/admin/system', 'user/admin/report')
  async queryAllReports(
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
    );
  }

  @Patch('/report')
  @Role('user/admin/system', 'user/admin/report')
  async updateReportStatus(
    @Body('reports') reportIds: number[],
    @Body('status') status: ReportStatus,
  ) {
    return await this.reportService.updateReportStatus(reportIds, status);
  }

  @Put('/paper/block')
  @Role('user/admin/system', 'user/admin/report', 'user/admin/resource')
  async blockPaper(@Body('papers') paperIds: number[]) {
    return await this.paperService.blockPaper(paperIds);
  }

  @Put('/paper/unblock')
  @Role('user/admin/system', 'user/admin/report', 'user/admin/resource')
  async unblockPaper(
    @Param('paper') paperId: number,
    @Body('papers') paperIds: number[],
  ) {
    return await this.paperService.unblockPaper(paperIds);
  }

  @Get('/paper')
  @Role('user/admin/system', 'user/admin/resource')
  async queryPapers(
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = 10,
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('page') page = '0',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.paperService.queryPapers(
      cursor,
      size,
      order,
      search,
      ['resource/paper/owner', 'resource/paper/maintainer'],
      parseInt(page),
    );
  }

  @Get('/exam')
  @Role('user/admin/system', 'user/admin/resource')
  async queryExams(
    @Query('last_cursor') lastCursor = '',
    @Query('size') size = '10',
    @Query('search') search = '',
    @Query('order') order: 'asc' | 'desc' = 'desc',
    @Query('page') page = '0',
  ) {
    const cursor = lastCursor ? parseInt(lastCursor) : null;
    return await this.examService.queryExams(
      cursor,
      parseInt(size),
      order,
      search,
      [
        'resource/exam/participant',
        'resource/exam/reviewer',
        'resource/exam/invigilator',
        'resource/exam/initiator',
      ],
      parseInt(page),
    );
  }
}
