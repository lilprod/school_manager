import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateLessonPlanDto } from './dto/create-lesson-plan.dto.js';
import { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto.js';
import { LessonPlansService } from './lesson-plans.service.js';

@ApiTags('lesson-plans')
@ApiBearerAuth()
@Controller('lesson-plans')
export class LessonPlansController {
  constructor(private readonly lessonPlansService: LessonPlansService) {}

  // Pas de rôle ADMIN ici volontairement : un enseignant gère ses propres
  // plans de cours, un admin ne les édite pas, il peut seulement les consulter.
  @Roles(Role.TEACHER)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLessonPlanDto) {
    return this.lessonPlansService.create(requireSchoolId(user), user.id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('teacherId') teacherId?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.lessonPlansService.findAll(requireSchoolId(user), { teacherId, classGroupId, subjectId });
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lessonPlansService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.TEACHER)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateLessonPlanDto) {
    return this.lessonPlansService.update(requireSchoolId(user), user.id, id, dto);
  }

  @Roles(Role.TEACHER)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lessonPlansService.remove(requireSchoolId(user), user.id, id);
  }
}
