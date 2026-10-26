import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateSyllabusDto } from './dto/create-syllabus.dto.js';
import { UpdateSyllabusDto } from './dto/update-syllabus.dto.js';
import { SyllabiService } from './syllabi.service.js';

@ApiTags('syllabi')
@ApiBearerAuth()
@Controller('syllabi')
export class SyllabiController {
  constructor(private readonly syllabiService: SyllabiService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSyllabusDto) {
    return this.syllabiService.create(requireSchoolId(user), dto);
  }

  // Lecture ouverte à tous les rôles authentifiés de l'école (élèves/parents
  // doivent pouvoir consulter le programme), même logique que SubjectsController.
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('subjectId') subjectId?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.syllabiService.findAll(requireSchoolId(user), { subjectId, classGroupId, academicYearId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.syllabiService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateSyllabusDto) {
    return this.syllabiService.update(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.syllabiService.remove(requireSchoolId(user), id);
  }
}
