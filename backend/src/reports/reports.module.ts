import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { AttendanceModule } from '../attendance/attendance.module.js';
import { GradingModule } from '../grading/grading.module.js';
import { InvoicesModule } from '../invoices/invoices.module.js';
import { StaffAttendanceModule } from '../staff-attendance/staff-attendance.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [AttendanceModule, GradingModule, InvoicesModule, StaffAttendanceModule],
  controllers: [ReportsController],
  providers: [ReportsService, StudentAccessService],
})
export class ReportsModule {}
