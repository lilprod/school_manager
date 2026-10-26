import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTermDto } from './dto/create-term.dto.js';
import type { UpdateTermDto } from './dto/update-term.dto.js';

@Injectable()
export class TermsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateTermDto) {
    const year = await this.prisma.academicYear.findFirst({ where: { id: dto.academicYearId, schoolId } });
    if (!year) {
      throw new NotFoundException('Année académique introuvable.');
    }
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    await this.assertValidRange(year, startDate, endDate, undefined);

    try {
      return await this.prisma.term.create({
        data: { schoolId, academicYearId: dto.academicYearId, name: dto.name, startDate, endDate },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Un trimestre portant ce nom existe déjà pour cette année.');
      }
      throw error;
    }
  }

  findAll(schoolId: string, academicYearId?: string) {
    return this.prisma.term.findMany({
      where: { schoolId, ...(academicYearId ? { academicYearId } : {}) },
      orderBy: { startDate: 'asc' },
    });
  }

  /** Trimestres des années où l'un des enfants du parent est inscrit, toutes écoles confondues. */
  async findAllForParent(parentUserId: string, academicYearId?: string) {
    return this.prisma.term.findMany({
      where: {
        ...(academicYearId ? { academicYearId } : {}),
        academicYear: {
          enrollments: {
            some: { student: { guardians: { some: { parent: { userId: parentUserId } } } } },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async update(schoolId: string, id: string, dto: UpdateTermDto) {
    const term = await this.findOne(schoolId, id);
    const year = await this.prisma.academicYear.findUniqueOrThrow({ where: { id: term.academicYearId } });
    const startDate = dto.startDate ? new Date(dto.startDate) : term.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : term.endDate;
    await this.assertValidRange(year, startDate, endDate, id);

    try {
      return await this.prisma.term.update({
        where: { id },
        data: { name: dto.name, startDate, endDate },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Un trimestre portant ce nom existe déjà pour cette année.');
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.term.delete({ where: { id } });
  }

  private async findOne(schoolId: string, id: string) {
    const term = await this.prisma.term.findFirst({ where: { id, schoolId } });
    if (!term) {
      throw new NotFoundException('Trimestre introuvable.');
    }
    return term;
  }

  private async assertValidRange(
    year: { id: string; startDate: Date; endDate: Date },
    startDate: Date,
    endDate: Date,
    ignoreId: string | undefined,
  ) {
    if (startDate >= endDate) {
      throw new BadRequestException('La date de début doit précéder la date de fin.');
    }
    if (startDate < year.startDate || endDate > year.endDate) {
      throw new BadRequestException('Le trimestre doit être inclus dans l\'année académique.');
    }
    const overlapping = await this.prisma.term.findFirst({
      where: {
        academicYearId: year.id,
        ...(ignoreId ? { id: { not: ignoreId } } : {}),
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (overlapping) {
      throw new ConflictException(`Ce trimestre chevauche « ${overlapping.name} ».`);
    }
  }
}
