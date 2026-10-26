import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { CreateTermDto } from './dto/create-term.dto.js';
import { UpdateTermDto } from './dto/update-term.dto.js';
import { TermsService } from './terms.service.js';

@ApiTags('terms')
@ApiBearerAuth()
@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTermDto) {
    return this.termsService.create(requireSchoolId(user), dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('academicYearId') academicYearId?: string) {
    if (user.role === 'PARENT') {
      return this.termsService.findAllForParent(user.id, academicYearId);
    }
    return this.termsService.findAll(requireSchoolId(user), academicYearId);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateTermDto) {
    return this.termsService.update(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.termsService.remove(requireSchoolId(user), id);
  }
}
