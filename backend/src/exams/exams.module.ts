import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';

@Module({
  controllers: [ExamsController],
  providers: [ExamsService, StudentAccessService],
  exports: [ExamsService],
})
export class ExamsModule {}
