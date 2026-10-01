import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { LinkGuardianDto } from './dto/link-guardian.dto.js';
import { TransferStudentDto } from './dto/transfer-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { StudentsService } from './students.service.js';

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(user.schoolId, dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('classGroupId') classGroupId?: string) {
    return this.studentsService.findAll(user.schoolId, classGroupId);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.findOne(user.schoolId, id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/transfer')
  transfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TransferStudentDto,
  ) {
    return this.studentsService.transfer(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/guardians')
  linkGuardian(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LinkGuardianDto,
  ) {
    return this.studentsService.linkGuardian(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.remove(user.schoolId, id);
  }
}
