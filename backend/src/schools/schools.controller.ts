import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { UpdateSchoolDto } from './dto/update-school.dto.js';
import { SchoolsService } from './schools.service.js';

@ApiTags('schools')
@ApiBearerAuth()
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get('me')
  getMySchool(@CurrentUser() user: AuthenticatedUser) {
    return this.schoolsService.findOne(requireSchoolId(user));
  }

  @Roles(Role.ADMIN)
  @Patch('me')
  updateMySchool(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSchoolDto) {
    return this.schoolsService.update(requireSchoolId(user), dto);
  }
}
