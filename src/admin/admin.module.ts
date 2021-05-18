import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MenuModule } from 'src/menu/menu.module';
import { RoleModule } from 'src/role/role.module';
import { ReportModule } from 'src/report/report.module';
import { PaperModule } from 'src/paper/paper.module';
import { ExamModule } from 'src/exam/exam.module';
import { DynamicModule } from 'src/dynamic/dynamic.module';

@Module({
  imports: [
    MenuModule,
    RoleModule,
    ReportModule,
    PaperModule,
    ExamModule,
    DynamicModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
