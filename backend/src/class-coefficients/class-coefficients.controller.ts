import { Body, Controller, Delete, Get, Param, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { ClassCoefficientsService } from './class-coefficients.service.js';
import { SetClassCoefficientDto } from './dto/set-class-coefficient.dto.js';

@ApiTags('class-coefficients')
@ApiBearerAuth()
@Controller('class-coefficients')
export class ClassCoefficientsController {
  constructor(private readonly service: ClassCoefficientsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findForClass(@CurrentUser() user: AuthenticatedUser, @Query('classGroupId') classGroupId: string) {
    return this.service.findForClass(requireSchoolId(user), classGroupId);
  }

  @Roles(Role.ADMIN)
  @Put()
  set(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetClassCoefficientDto) {
    return this.service.set(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  reset(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.reset(requireSchoolId(user), id);
  }
}
