import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateFeeStructureDto } from './dto/create-fee-structure.dto.js';
import type { UpdateFeeStructureDto } from './dto/update-fee-structure.dto.js';

const feeStructureInclude = {
  academicYear: true,
  classGroup: true,
};

@Injectable()
export class FeeStructuresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateFeeStructureDto) {
    await this.assertAcademicYearInSchool(schoolId, dto.academicYearId);
    if (dto.classGroupId) {
      await this.assertClassGroupInSchool(schoolId, dto.classGroupId);
    }

    return this.prisma.feeStructure.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        classGroupId: dto.classGroupId,
        name: dto.name,
        amount: dto.amount,
        currency: dto.currency ?? 'XOF',
      },
      include: feeStructureInclude,
    });
  }

  async findAll(schoolId: string, filters: { academicYearId?: string; classGroupId?: string } = {}) {
    return this.prisma.feeStructure.findMany({
      where: {
        schoolId,
        academicYearId: filters.academicYearId,
        classGroupId: filters.classGroupId,
      },
      include: feeStructureInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id, schoolId },
      include: feeStructureInclude,
    });
    if (!feeStructure) {
      throw new NotFoundException('Barème de frais introuvable.');
    }
    return feeStructure;
  }

  async update(schoolId: string, id: string, dto: UpdateFeeStructureDto) {
    await this.findOne(schoolId, id);

    if (dto.academicYearId) {
      await this.assertAcademicYearInSchool(schoolId, dto.academicYearId);
    }
    if (dto.classGroupId) {
      await this.assertClassGroupInSchool(schoolId, dto.classGroupId);
    }

    return this.prisma.feeStructure.update({
      where: { id },
      data: {
        academicYearId: dto.academicYearId,
        classGroupId: dto.classGroupId,
        name: dto.name,
        amount: dto.amount,
        currency: dto.currency,
      },
      include: feeStructureInclude,
    });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.feeStructure.delete({ where: { id } });
  }

  private async assertAcademicYearInSchool(schoolId: string, academicYearId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
    if (!academicYear) {
      throw new NotFoundException('Année académique introuvable.');
    }
  }

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }
}
