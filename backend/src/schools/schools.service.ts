import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateSchoolDto } from './dto/update-school.dto.js';

@Injectable()
export class SchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(schoolId: string) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('École introuvable.');
    }
    return school;
  }

  async update(schoolId: string, dto: UpdateSchoolDto) {
    await this.findOne(schoolId);
    return this.prisma.school.update({ where: { id: schoolId }, data: dto });
  }
}
