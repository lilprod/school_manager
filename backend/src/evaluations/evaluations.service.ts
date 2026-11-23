import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateEvaluationDto } from './dto/create-evaluation.dto.js';

const evaluatorSelect = { id: true, firstName: true, lastName: true, email: true } as const;

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, evaluatorId: string, teacherId: string, dto: CreateEvaluationDto) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    return this.prisma.evaluation.create({
      data: {
        teacherId,
        evaluatorId,
        score: dto.score,
        comments: dto.comments,
        evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : undefined,
      },
    });
  }

  async findAllForTeacher(schoolId: string, teacherId: string) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    return this.prisma.evaluation.findMany({
      where: { teacherId },
      include: { evaluator: { select: evaluatorSelect } },
      orderBy: { evaluationDate: 'desc' },
    });
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
