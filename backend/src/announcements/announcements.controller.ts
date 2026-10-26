import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AnnouncementsService } from './announcements.service.js';
import { CreateAnnouncementDto } from './dto/create-announcement.dto.js';

@ApiTags('announcements')
@ApiBearerAuth()
@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAnnouncementDto) {
    return this.announcementsService.create(requireSchoolId(user), user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('schoolId') schoolIdQuery?: string) {
    // Un ADMIN/TEACHER/STUDENT a toujours un schoolId. Un PARENT peut avoir des
    // enfants dans plusieurs écoles et doit préciser laquelle consulter.
    const schoolId = user.schoolId ?? schoolIdQuery;
    if (!schoolId) {
      throw new BadRequestException(
        'Le paramètre schoolId est requis pour consulter les annonces d\'une école donnée.',
      );
    }
    return this.announcementsService.findAllForUser(schoolId, user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.announcementsService.remove(requireSchoolId(user), id);
  }
}
