import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSyllabusDto } from './dto/create-syllabus.dto.js';
import type { UpdateSyllabusDto } from './dto/update-syllabus.dto.js';

const syllabusInclude = { subject: true, classGroup: true, academicYear: true };

export interface SyllabusFilters {
  subjectId?: string;
  classGroupId?: string;
  academicYearId?: string;
}

@Injectable()
export class SyllabiService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateSyllabusDto) {
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);

    return this.prisma.syllabus.create({
      data: {
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        title: dto.title,
        description: dto.description,
      },
      include: syllabusInclude,
    });
  }

  findAll(schoolId: string, filters: SyllabusFilters) {
    return this.prisma.syllabus.findMany({
      where: {
        classGroup: { schoolId },
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters.classGroupId ? { classGroupId: filters.classGroupId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: syllabusInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const syllabus = await this.prisma.syllabus.findFirst({
      where: { id, classGroup: { schoolId } },
      include: syllabusInclude,
    });
    if (!syllabus) {
      throw new NotFoundException('Programme introuvable.');
    }
    return syllabus;
  }

  async update(schoolId: string, id: string, dto: UpdateSyllabusDto) {
    await this.findOne(schoolId, id);
    return this.prisma.syllabus.update({
      where: { id },
      data: dto,
      include: syllabusInclude,
    });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.syllabus.delete({ where: { id } });
  }

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }
}
