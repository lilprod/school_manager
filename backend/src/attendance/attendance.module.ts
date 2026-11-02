import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { AttendanceController } from './attendance.controller.js';
import { AttendanceService } from './attendance.service.js';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, StudentAccessService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
