import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { AssignmentsController } from './assignments.controller.js';
import { AssignmentsService } from './assignments.service.js';

@Module({
  controllers: [AssignmentsController],
  providers: [AssignmentsService, StudentAccessService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
