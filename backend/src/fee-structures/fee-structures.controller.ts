import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto.js';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto.js';
import { FeeStructuresService } from './fee-structures.service.js';

@ApiTags('fee-structures')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('fee-structures')
export class FeeStructuresController {
  constructor(private readonly feeStructuresService: FeeStructuresService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateFeeStructureDto) {
    return this.feeStructuresService.create(requireSchoolId(user), dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('academicYearId') academicYearId?: string,
    @Query('classGroupId') classGroupId?: string,
  ) {
    return this.feeStructuresService.findAll(requireSchoolId(user), { academicYearId, classGroupId });
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.feeStructuresService.findOne(requireSchoolId(user), id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateFeeStructureDto,
  ) {
    return this.feeStructuresService.update(requireSchoolId(user), id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.feeStructuresService.remove(requireSchoolId(user), id);
  }
}
