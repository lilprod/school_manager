import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import { CreateEvaluationDto } from './dto/create-evaluation.dto.js';
import { EvaluationsService } from './evaluations.service.js';

@ApiTags('evaluations')
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller('teachers/:teacherId/evaluations')
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('teacherId') teacherId: string,
    @Body() dto: CreateEvaluationDto,
  ) {
    return this.evaluationsService.create(requireSchoolId(user), user.id, teacherId, dto);
  }

  @Get()
  findAllForTeacher(@CurrentUser() user: AuthenticatedUser, @Param('teacherId') teacherId: string) {
    return this.evaluationsService.findAllForTeacher(requireSchoolId(user), teacherId);
  }
}
