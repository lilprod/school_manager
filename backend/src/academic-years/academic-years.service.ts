import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAcademicYearDto } from './dto/create-academic-year.dto.js';
import type { UpdateAcademicYearDto } from './dto/update-academic-year.dto.js';

@Injectable()
export class AcademicYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateAcademicYearDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({ where: { schoolId }, data: { isCurrent: false } });
      }
      return tx.academicYear.create({
        data: {
          schoolId,
          label: dto.label,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          isCurrent: dto.isCurrent ?? false,
        },
      });
    });
  }

  findAll(schoolId: string) {
    return this.prisma.academicYear.findMany({
      where: { schoolId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id, schoolId } });
    if (!year) {
      throw new NotFoundException('Année académique introuvable.');
    }
    return year;
  }

  async update(schoolId: string, id: string, dto: UpdateAcademicYearDto) {
    await this.findOne(schoolId, id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.isCurrent) {
        await tx.academicYear.updateMany({ where: { schoolId }, data: { isCurrent: false } });
      }
      return tx.academicYear.update({
        where: { id },
        data: {
          ...dto,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
      });
    });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.academicYear.delete({ where: { id } });
  }
}
