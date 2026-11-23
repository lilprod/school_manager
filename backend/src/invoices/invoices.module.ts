import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { InvoicesController } from './invoices.controller.js';
import { InvoicesService } from './invoices.service.js';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService, StudentAccessService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
