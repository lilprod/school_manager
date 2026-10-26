import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AcademicYearsService } from './academic-years.service.js';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import { UpdateAcademicYearDto } from './dto/update-academic-year.dto.js';

@ApiTags('academic-years')
@ApiBearerAuth()
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private readonly academicYearsService: AcademicYearsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAcademicYearDto) {
    return this.academicYearsService.create(requireSchoolId(user), dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === 'PARENT') {
      return this.academicYearsService.findAllForParent(user.id);
    }
    return this.academicYearsService.findAll(requireSchoolId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academicYearsService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateAcademicYearDto,
  ) {
    return this.academicYearsService.update(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.academicYearsService.remove(requireSchoolId(user), id);
  }
}
