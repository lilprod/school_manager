import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateContractDto } from './dto/create-contract.dto.js';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, teacherId: string, dto: CreateContractDto) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    return this.prisma.contract.create({
      data: {
        teacherId,
        contractType: dto.contractType,
        salaryAmount: dto.salaryAmount,
        currency: dto.currency,
        startDate: new Date(dto.startDate),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async findAllForTeacher(schoolId: string, teacherId: string) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    return this.prisma.contract.findMany({
      where: { teacherId },
      orderBy: { startDate: 'desc' },
    });
  }

  async findOne(schoolId: string, teacherId: string, id: string) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    const contract = await this.prisma.contract.findFirst({ where: { id, teacherId } });
    if (!contract) {
      throw new NotFoundException('Contrat introuvable.');
    }
    return contract;
  }

  async remove(schoolId: string, teacherId: string, id: string) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    const contract = await this.prisma.contract.findFirst({ where: { id, teacherId } });
    if (!contract) {
      throw new NotFoundException('Contrat introuvable.');
    }
    await this.prisma.contract.delete({ where: { id } });
  }

  private async assertTeacherInSchool(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherId, user: { schoolId } },
    });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }
  }
}
