import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SetClassCoefficientDto } from './dto/set-class-coefficient.dto.js';

@Injectable()
export class ClassCoefficientsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Toutes les matières de l'école avec leur coefficient effectif pour la classe. */
  async findForClass(schoolId: string, classGroupId: string) {
    await this.assertClassGroup(schoolId, classGroupId);
    const [subjects, overrides] = await Promise.all([
      this.prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } }),
      this.prisma.classSubjectCoefficient.findMany({ where: { classGroupId } }),
    ]);
    const bySubject = new Map(overrides.map((o) => [o.subjectId, o]));
    return subjects.map((subject) => {
      const override = bySubject.get(subject.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        defaultCoefficient: subject.coefficient,
        overrideId: override?.id ?? null,
        coefficient: override?.coefficient ?? subject.coefficient,
      };
    });
  }

  async set(schoolId: string, dto: SetClassCoefficientDto) {
    await this.assertClassGroup(schoolId, dto.classGroupId);
    const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
    if (!subject) {
      throw new NotFoundException('Matière introuvable.');
    }
    return this.prisma.classSubjectCoefficient.upsert({
      where: { classGroupId_subjectId: { classGroupId: dto.classGroupId, subjectId: dto.subjectId } },
      create: { classGroupId: dto.classGroupId, subjectId: dto.subjectId, coefficient: dto.coefficient },
      update: { coefficient: dto.coefficient },
    });
  }

  /** Supprime la surcharge : la matière reprend son coefficient par défaut. */
  async reset(schoolId: string, id: string) {
    const override = await this.prisma.classSubjectCoefficient.findFirst({
      where: { id, classGroup: { schoolId } },
    });
    if (!override) {
      throw new NotFoundException('Coefficient de classe introuvable.');
    }
    await this.prisma.classSubjectCoefficient.delete({ where: { id } });
  }

  private async assertClassGroup(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }
}
