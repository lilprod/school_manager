import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { BulkEnterGradesDto } from './dto/bulk-enter-grades.dto.js';
import { CreateAssessmentDto } from './dto/create-assessment.dto.js';
import { UpdateAssessmentDto } from './dto/update-assessment.dto.js';
import { GradingService } from './grading.service.js';

@ApiTags('grading')
@ApiBearerAuth()
@Controller()
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('assessments')
  createAssessment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAssessmentDto) {
    return this.gradingService.createAssessment(user.schoolId, dto);
  }

  @Get('assessments')
  findAssessments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classGroupId') classGroupId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.gradingService.findAssessments(user.schoolId, { classGroupId, subjectId, academicYearId });
  }

  @Get('assessments/:id')
  findAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gradingService.findAssessment(user.schoolId, id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch('assessments/:id')
  updateAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.gradingService.updateAssessment(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete('assessments/:id')
  removeAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gradingService.removeAssessment(user.schoolId, id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('assessments/:id/grades')
  enterGrades(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BulkEnterGradesDto,
  ) {
    return this.gradingService.enterGrades(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('assessments/:id/grades')
  gradesForAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gradingService.gradesForAssessment(user.schoolId, id);
  }

  @Get('grades/student/:studentId')
  gradesForStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.gradingService.gradesForStudent(user.schoolId, user, studentId, academicYearId);
  }

  @Get('grades/student/:studentId/report-card')
  reportCard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
  ) {
    return this.gradingService.reportCard(user.schoolId, user, studentId, academicYearId);
  }
}
