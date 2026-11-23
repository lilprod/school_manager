import { Module } from '@nestjs/common';
import { ClassGroupsController } from './class-groups.controller.js';
import { ClassGroupsService } from './class-groups.service.js';

@Module({
  controllers: [ClassGroupsController],
  providers: [ClassGroupsService],
  exports: [ClassGroupsService],
})
export class ClassGroupsModule {}
