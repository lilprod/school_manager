import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AssignmentsService } from './assignments.service.js';
import { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import { GradeSubmissionDto } from './dto/grade-submission.dto.js';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto.js';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  // Même vérification de propriété que les plans de cours : pas de rôle
  // ADMIN sur create/remove, un enseignant ne gère que ses propres devoirs.
  @Roles(Role.TEACHER)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.create(requireSchoolId(user), user.id, dto);
  }

  // Lecture ouverte à tous les rôles authentifiés de l'école.
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('subjectId') subjectId?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.assignmentsService.findAll(requireSchoolId(user), { subjectId, classGroupId, academicYearId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.assignmentsService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.TEACHER)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.assignmentsService.remove(requireSchoolId(user), user.id, id);
  }

  @Roles(Role.STUDENT)
  @Post(':id/submit')
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SubmitAssignmentDto) {
    return this.assignmentsService.submit(user.id, id, dto);
  }

  // Soumission de l'élève connecté pour ce devoir (raccourci pratique côté
  // front, qui n'a que l'id utilisateur et pas le studentProfile.id).
  @Roles(Role.STUDENT)
  @Get(':id/submissions/me')
  findMySubmission(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.assignmentsService.findMySubmission(user.id, id);
  }

  // Consultation de la soumission d'un élève précis (lui-même, ses parents
  // quelle que soit l'école, ou ADMIN/TEACHER de l'école) — même pattern que
  // GradingController#gradesForStudent.
  @Get(':id/submissions/student/:studentId')
  submissionForStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('studentId') studentId: string,
  ) {
    return this.assignmentsService.submissionForStudent(user.schoolId, user, id, studentId);
  }

  // Liste complète des soumissions pour correction — réservée à l'enseignant
  // qui a créé le devoir.
  @Roles(Role.TEACHER)
  @Get(':id/submissions')
  findSubmissions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.assignmentsService.findSubmissions(requireSchoolId(user), user.id, id);
  }

  @Roles(Role.TEACHER)
  @Patch(':id/submissions/:submissionId/grade')
  gradeSubmission(
    @CurrentUser() user: AuthenticatedUser,
    @Param('submissionId') submissionId: string,
    @Body() dto: GradeSubmissionDto,
  ) {
    return this.assignmentsService.gradeSubmission(requireSchoolId(user), user.id, submissionId, dto);
  }
}
