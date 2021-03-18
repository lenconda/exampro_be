import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { ReportType } from './report_type.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportType])],
  providers: [ReportService],
  controllers: [ReportController],
  exports: [ReportService],
})
export class ReportModule {}
