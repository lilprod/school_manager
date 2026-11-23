import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateLessonPlanDto } from './dto/create-lesson-plan.dto.js';
import type { UpdateLessonPlanDto } from './dto/update-lesson-plan.dto.js';

const lessonPlanInclude = { subject: true, classGroup: true, teacher: { include: { user: true } } };

export interface LessonPlanFilters {
  teacherId?: string;
  classGroupId?: string;
  subjectId?: string;
}

@Injectable()
export class LessonPlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, userId: string, dto: CreateLessonPlanDto) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);

    return this.prisma.lessonPlan.create({
      data: {
        teacherId,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        date: new Date(dto.date),
        title: dto.title,
        objectives: dto.objectives,
        content: dto.content,
      },
      include: lessonPlanInclude,
    });
  }

  findAll(schoolId: string, filters: LessonPlanFilters) {
    return this.prisma.lessonPlan.findMany({
      where: {
        classGroup: { schoolId },
        ...(filters.teacherId ? { teacherId: filters.teacherId } : {}),
        ...(filters.classGroupId ? { classGroupId: filters.classGroupId } : {}),
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
      },
      include: lessonPlanInclude,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const lessonPlan = await this.prisma.lessonPlan.findFirst({
      where: { id, classGroup: { schoolId } },
      include: lessonPlanInclude,
    });
    if (!lessonPlan) {
      throw new NotFoundException('Plan de cours introuvable.');
    }
    return lessonPlan;
  }

  async update(schoolId: string, userId: string, id: string, dto: UpdateLessonPlanDto) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);
    const lessonPlan = await this.findOne(schoolId, id);
    if (lessonPlan.teacherId !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres plans de cours.');
    }

    return this.prisma.lessonPlan.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      include: lessonPlanInclude,
    });
  }

  async remove(schoolId: string, userId: string, id: string) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);
    const lessonPlan = await this.findOne(schoolId, id);
    if (lessonPlan.teacherId !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres plans de cours.');
    }

    await this.prisma.lessonPlan.delete({ where: { id } });
  }

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }

  private async resolveTeacherId(schoolId: string, userId: string): Promise<string> {
    const teacher = await this.prisma.teacherProfile.findFirst({ where: { userId, user: { schoolId } } });
    if (!teacher) {
      throw new ForbiddenException('Aucun profil enseignant associé à ce compte.');
    }
    return teacher.id;
  }
}
