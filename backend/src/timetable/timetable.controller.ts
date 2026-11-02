import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { TimetableService } from './timetable.service.js';
import { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto.js';

@ApiTags('timetable')
@ApiBearerAuth()
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTimetableSlotDto) {
    return this.timetableService.create(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('classGroupId') classGroupId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.timetableService.findAll(requireSchoolId(user), {
      classGroupId,
      teacherId,
      academicYearId,
    });
  }

  @Roles(Role.ADMIN, Role.TEACHER, Role.STUDENT)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.timetableService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.timetableService.remove(requireSchoolId(user), id);
  }
}
