import { Module } from '@nestjs/common';
import { ClassCoefficientsController } from './class-coefficients.controller.js';
import { ClassCoefficientsService } from './class-coefficients.service.js';

@Module({
  controllers: [ClassCoefficientsController],
  providers: [ClassCoefficientsService],
})
export class ClassCoefficientsModule {}
