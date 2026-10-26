import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
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
    return this.gradingService.createAssessment(requireSchoolId(user), dto);
  }

  @Get('assessments')
  findAssessments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classGroupId') classGroupId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('termId') termId?: string,
  ) {
    return this.gradingService.findAssessments(requireSchoolId(user), {
      classGroupId,
      subjectId,
      academicYearId,
      termId,
    });
  }

  @Get('assessments/:id')
  findAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gradingService.findAssessment(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch('assessments/:id')
  updateAssessment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
  ) {
    return this.gradingService.updateAssessment(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete('assessments/:id')
  removeAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gradingService.removeAssessment(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('assessments/:id/grades')
  enterGrades(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: BulkEnterGradesDto,
  ) {
    return this.gradingService.enterGrades(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('assessments/:id/grades')
  gradesForAssessment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gradingService.gradesForAssessment(requireSchoolId(user), id);
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
    @Query('termId') termId?: string,
  ) {
    return this.gradingService.reportCard(user.schoolId, user, studentId, academicYearId, termId);
  }
}
