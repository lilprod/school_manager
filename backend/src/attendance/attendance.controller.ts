import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AttendanceService } from './attendance.service.js';
import { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto.js';
import { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import { UpdateAttendanceDto } from './dto/update-attendance.dto.js';

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post()
  mark(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkAttendanceDto) {
    return this.attendanceService.mark(user.schoolId, user.id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Post('bulk')
  bulkMark(@CurrentUser() user: AuthenticatedUser, @Body() dto: BulkMarkAttendanceDto) {
    return this.attendanceService.bulkMark(user.schoolId, user.id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classGroupId') classGroupId?: string,
    @Query('studentId') studentId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.attendanceService.findAll(user.schoolId, {
      classGroupId,
      studentId,
      subjectId,
      date,
      from,
      to,
    });
  }

  @Get('student/:studentId')
  findForStudent(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.attendanceService.findForStudent(user.schoolId, user, studentId);
  }

  @Get('student/:studentId/summary')
  summaryForStudent(@CurrentUser() user: AuthenticatedUser, @Param('studentId') studentId: string) {
    return this.attendanceService.summaryForStudent(user.schoolId, user, studentId);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAttendanceDto) {
    return this.attendanceService.update(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.attendanceService.remove(user.schoolId, id);
  }
}
