import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateStudentDto } from './dto/create-student.dto.js';
import { LinkGuardianDto } from './dto/link-guardian.dto.js';
import { TransferStudentDto } from './dto/transfer-student.dto.js';
import { UpdateStudentDto } from './dto/update-student.dto.js';
import { StudentsService } from './students.service.js';

const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png'];
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStudentDto) {
    return this.studentsService.create(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('classGroupId') classGroupId?: string) {
    return this.studentsService.findAll(requireSchoolId(user), classGroupId);
  }

  @Roles(Role.STUDENT)
  @Get('me/profile')
  findMyProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findMyProfile(requireSchoolId(user), user.id);
  }

  @Roles(Role.PARENT)
  @Get('my-children')
  findMyChildren(@CurrentUser() user: AuthenticatedUser) {
    return this.studentsService.findMyChildren(user.id);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/transfer')
  transfer(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: TransferStudentDto,
  ) {
    return this.studentsService.transfer(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Post(':id/guardians')
  linkGuardian(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LinkGuardianDto,
  ) {
    return this.studentsService.linkGuardian(requireSchoolId(user), id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.remove(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Post(':id/graduate')
  graduate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.studentsService.graduate(requireSchoolId(user), id);
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
    return this.studentsService.uploadPhoto(requireSchoolId(user), id, file);
  }

  @Roles(Role.ADMIN, Role.TEACHER)
  @Get(':id/id-card')
  async getIdCard(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.studentsService.generateIdCardPdf(requireSchoolId(user), id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="carte-elve-${id}.pdf"`,
    });
    res.send(buffer);
  }
}
