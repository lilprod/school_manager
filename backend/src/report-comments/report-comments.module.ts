import { Module } from '@nestjs/common';
import { ReportCommentsController } from './report-comments.controller.js';
import { ReportCommentsService } from './report-comments.service.js';

@Module({
  controllers: [ReportCommentsController],
  providers: [ReportCommentsService],
})
export class ReportCommentsModule {}
