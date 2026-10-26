import { Body, Controller, Get, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { SaveReportCommentDto } from './dto/save-report-comment.dto.js';
import { ReportCommentsService } from './report-comments.service.js';

@ApiTags('report-comments')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.TEACHER)
@Controller('report-comments')
export class ReportCommentsController {
  constructor(private readonly service: ReportCommentsService) {}

  @Put()
  save(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveReportCommentDto) {
    return this.service.save(requireSchoolId(user), user, dto);
  }

  @Get()
  findForClass(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classGroupId') classGroupId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('termId') termId?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.service.findForClass(requireSchoolId(user), {
      classGroupId,
      academicYearId,
      termId: termId || undefined,
      subjectId: subjectId || undefined,
    });
  }
}
