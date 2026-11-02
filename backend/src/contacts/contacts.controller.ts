import { Controller, ForbiddenException, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ContactsService } from './contacts.service.js';

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findContacts(@CurrentUser() user: AuthenticatedUser, @Query('q') q?: string, @Query('role') role?: string) {
    if (user.role === 'SUPER_ADMIN') {
      throw new ForbiddenException('Annuaire non disponible pour ce rôle.');
    }
    return this.contactsService.findContacts(user, { q, role });
  }

  @Get('student/:studentId/teachers')
  findTeachersOfStudent(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.contactsService.findTeachersOfStudent(user, studentId);
  }
}
