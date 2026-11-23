import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { MeetingsService } from './meetings.service.js';
import { RequestMeetingDto } from './dto/request-meeting.dto.js';

@ApiTags('meetings')
@ApiBearerAuth()
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Roles(Role.PARENT)
  @Post()
  request(@CurrentUser() user: AuthenticatedUser, @Body() dto: RequestMeetingDto) {
    return this.meetingsService.request(user.id, dto);
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @Patch(':id/confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.meetingsService.confirm(user, id);
  }

  @Roles(Role.TEACHER, Role.ADMIN)
  @Patch(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.meetingsService.cancel(user, id);
  }

  @Patch(':id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.meetingsService.complete(user, id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.meetingsService.findAllForUser(user);
  }
}
