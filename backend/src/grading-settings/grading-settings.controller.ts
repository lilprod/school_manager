import { Body, Controller, Delete, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { UpdateGradingSettingsDto } from './dto/update-grading-settings.dto.js';
import { GradingSettingsService } from './grading-settings.service.js';

@ApiTags('grading-settings')
@ApiBearerAuth()
@Controller('grading-settings')
export class GradingSettingsController {
  constructor(private readonly service: GradingSettingsService) {}

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  get(@CurrentUser() user: AuthenticatedUser) {
    return this.service.get(requireSchoolId(user));
  }

  @Roles(Role.ADMIN)
  @Put()
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateGradingSettingsDto) {
    return this.service.update(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Delete()
  reset(@CurrentUser() user: AuthenticatedUser) {
    return this.service.reset(requireSchoolId(user));
  }
}
