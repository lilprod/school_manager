import { Module } from '@nestjs/common';
import { TermsController } from './terms.controller.js';
import { TermsService } from './terms.service.js';

@Module({
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule {}
