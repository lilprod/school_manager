import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get('attendance.csv')
  async attendanceCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('classGroupId') classGroupId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.reportsService.attendanceCsv(requireSchoolId(user), { classGroupId, from, to });
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="presences.csv"',
    });
    res.send(csv);
  }

  @Roles(Role.ADMIN)
  @Get('finance.csv')
  async financeCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('classGroupId') classGroupId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    const csv = await this.reportsService.financeCsv(requireSchoolId(user), { classGroupId, academicYearId });
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="finances.csv"',
    });
    res.send(csv);
  }

  @Roles(Role.ADMIN)
  @Get('staff-attendance.csv')
  async staffAttendanceCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const csv = await this.reportsService.staffAttendanceCsv(requireSchoolId(user), user, { from, to });
    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="presences-personnel.csv"',
    });
    res.send(csv);
  }

  @Get('report-card/:studentId.pdf')
  async reportCardPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Res() res: Response,
    @Query('termId') termId?: string,
  ) {
    const buffer = await this.reportsService.reportCardPdf(user.schoolId, user, studentId, academicYearId, termId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bulletin-${studentId}.pdf"`,
    });
    res.send(buffer);
  }

  @Roles(Role.ADMIN)
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.summary(requireSchoolId(user));
  }
}
