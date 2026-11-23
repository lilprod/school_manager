import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { AssignTeacherDto } from './dto/assign-teacher.dto.js';
import { CreateTeacherDto } from './dto/create-teacher.dto.js';
import { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import { TeachersService } from './teachers.service.js';

const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

@ApiTags('teachers')
@ApiBearerAuth()
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTeacherDto) {
    return this.teachersService.create(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.teachersService.findAll(requireSchoolId(user));
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.teachersService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teachersService.update(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/assignments')
  assign(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AssignTeacherDto) {
    return this.teachersService.assign(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id/assignments/:assignmentId')
  unassign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('assignmentId') assignmentId: string,
  ) {
    return this.teachersService.unassign(requireSchoolId(user), id, assignmentId);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.teachersService.remove(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_PHOTO_SIZE },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.mimetype)) {
          callback(new BadRequestException('Seules les images JPEG et PNG sont autorisées.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadPhoto(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.teachersService.uploadPhoto(requireSchoolId(user), id, file);
  }
}
