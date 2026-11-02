import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { CreateExamSessionDto } from './dto/create-exam-session.dto.js';
import { CreateExamSlotDto } from './dto/create-exam-slot.dto.js';
import { UpdateExamSessionDto } from './dto/update-exam-session.dto.js';
import { UpdateExamSlotDto } from './dto/update-exam-slot.dto.js';
import { ExamsService } from './exams.service.js';

@ApiTags('exams')
@ApiBearerAuth()
@Controller()
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Roles(Role.ADMIN)
  @Post('exam-sessions')
  createSession(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamSessionDto) {
    return this.examsService.createSession(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('exam-sessions')
  findSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('academicYearId') academicYearId?: string,
    @Query('termId') termId?: string,
  ) {
    return this.examsService.findSessions(requireSchoolId(user), { academicYearId, termId });
  }

  @Roles(Role.ADMIN)
  @Patch('exam-sessions/:id')
  updateSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateExamSessionDto,
  ) {
    return this.examsService.updateSession(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('exam-sessions/:id')
  removeSession(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.examsService.removeSession(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Post('exam-sessions/:sessionId/slots')
  createSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateExamSlotDto,
  ) {
    return this.examsService.createSlot(requireSchoolId(user), sessionId, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('exam-sessions/:sessionId/slots')
  findSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
    @Query('classGroupId') classGroupId?: string,
  ) {
    return this.examsService.findSlots(requireSchoolId(user), sessionId, classGroupId);
  }

  @Roles(Role.ADMIN)
  @Patch('exam-slots/:id')
  updateSlot(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateExamSlotDto) {
    return this.examsService.updateSlot(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete('exam-slots/:id')
  removeSlot(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.examsService.removeSlot(requireSchoolId(user), id);
  }

  @Get('students/:studentId/exams')
  findForStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.examsService.findForStudent(user, studentId, sessionId);
  }
}
