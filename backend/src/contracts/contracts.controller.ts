import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { ContractsService } from './contracts.service.js';
import { CreateContractDto } from './dto/create-contract.dto.js';

@ApiTags('contracts')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('teachers/:teacherId/contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.create(requireSchoolId(user), teacherId, dto);
  }

  @Get()
  findAllForTeacher(@CurrentUser() user: AuthenticatedUser, @Param('teacherId') teacherId: string) {
    return this.contractsService.findAllForTeacher(requireSchoolId(user), teacherId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.findOne(requireSchoolId(user), teacherId, id);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Param('id') id: string,
  ) {
    return this.contractsService.remove(requireSchoolId(user), teacherId, id);
  }
}
