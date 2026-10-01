import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { ClassGroupsService } from './class-groups.service.js';
import { CreateClassGroupDto } from './dto/create-class-group.dto.js';
import { UpdateClassGroupDto } from './dto/update-class-group.dto.js';

@ApiTags('class-groups')
@ApiBearerAuth()
@Controller('class-groups')
export class ClassGroupsController {
  constructor(private readonly classGroupsService: ClassGroupsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClassGroupDto) {
    return this.classGroupsService.create(user.schoolId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.classGroupsService.findAll(user.schoolId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.classGroupsService.findOne(user.schoolId, id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateClassGroupDto,
  ) {
    return this.classGroupsService.update(user.schoolId, id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.classGroupsService.remove(user.schoolId, id);
  }
}
