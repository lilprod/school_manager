import { Module } from '@nestjs/common';
import { FeeStructuresController } from './fee-structures.controller.js';
import { FeeStructuresService } from './fee-structures.service.js';

@Module({
  controllers: [FeeStructuresController],
  providers: [FeeStructuresService],
  exports: [FeeStructuresService],
})
export class FeeStructuresModule {}
