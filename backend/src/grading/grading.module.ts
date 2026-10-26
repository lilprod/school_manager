import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { GradingController } from './grading.controller.js';
import { GradingService } from './grading.service.js';

@Module({
  controllers: [GradingController],
  providers: [GradingService, StudentAccessService],
  exports: [GradingService],
})
export class GradingModule {}
