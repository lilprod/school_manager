import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { MarkStaffAttendanceDto } from './dto/mark-staff-attendance.dto.js';
import { StaffAttendanceService } from './staff-attendance.service.js';

@ApiTags('staff-attendance')
@ApiBearerAuth()
@Controller('staff-attendance')
export class StaffAttendanceController {
  constructor(private readonly staffAttendanceService: StaffAttendanceService) {}

  @Roles(Role.ADMIN)
  @Post()
  mark(@CurrentUser() user: AuthenticatedUser, @Body() dto: MarkStaffAttendanceDto) {
    return this.staffAttendanceService.mark(requireSchoolId(user), user.id, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('teacherId') teacherId?: string,
    @Query('date') date?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.staffAttendanceService.findAll(requireSchoolId(user), user, { teacherId, date, from, to });
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('teacher/:teacherId/summary')
  summaryForTeacher(@CurrentUser() user: AuthenticatedUser, @Param('teacherId') teacherId: string) {
    return this.staffAttendanceService.summaryForTeacher(requireSchoolId(user), user, teacherId);
  }
}
