import { Module } from '@nestjs/common';
import { SyllabiController } from './syllabi.controller.js';
import { SyllabiService } from './syllabi.service.js';

@Module({
  controllers: [SyllabiController],
  providers: [SyllabiService],
  exports: [SyllabiService],
})
export class SyllabiModule {}
