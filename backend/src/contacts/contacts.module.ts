import { Module } from '@nestjs/common';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { ContactsController } from './contacts.controller.js';
import { ContactsService } from './contacts.service.js';

@Module({
  controllers: [ContactsController],
  providers: [ContactsService, StudentAccessService],
})
export class ContactsModule {}
