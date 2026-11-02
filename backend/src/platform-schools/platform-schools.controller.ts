import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Role, type SchoolStatus } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { ApproveSchoolDto } from './dto/approve-school.dto.js';
import { CreateSchoolDto } from './dto/create-school.dto.js';
import { SignupSchoolDto } from './dto/signup-school.dto.js';
import { PlatformSchoolsService } from './platform-schools.service.js';

@ApiTags('platform-schools')
@ApiBearerAuth()
@Controller('platform/schools')
export class PlatformSchoolsController {
  constructor(private readonly platformSchoolsService: PlatformSchoolsService) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('signup')
  signup(@Body() dto: SignupSchoolDto) {
    return this.platformSchoolsService.signup(dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post()
  createManually(@Body() dto: CreateSchoolDto) {
    return this.platformSchoolsService.createManually(dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Get()
  findAll(@Query('status') status?: SchoolStatus) {
    return this.platformSchoolsService.findAll({ status });
  }

  @Roles(Role.SUPER_ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.platformSchoolsService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: ApproveSchoolDto) {
    return this.platformSchoolsService.approve(id, dto);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post(':id/suspend')
  suspend(@Param('id') id: string) {
    return this.platformSchoolsService.suspend(id);
  }

  @Roles(Role.SUPER_ADMIN)
  @Post(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.platformSchoolsService.reactivate(id);
  }
}
