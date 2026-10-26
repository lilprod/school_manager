import { Module } from '@nestjs/common';
import { LessonPlansController } from './lesson-plans.controller.js';
import { LessonPlansService } from './lesson-plans.service.js';

@Module({
  controllers: [LessonPlansController],
  providers: [LessonPlansService],
  exports: [LessonPlansService],
})
export class LessonPlansModule {}
