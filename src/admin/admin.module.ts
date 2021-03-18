import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { MenuModule } from 'src/menu/menu.module';
import { RoleModule } from 'src/role/role.module';
import { ReportModule } from 'src/report/report.module';

@Module({
  imports: [MenuModule, RoleModule, ReportModule],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
