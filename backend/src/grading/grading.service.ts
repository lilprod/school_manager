import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BulkEnterGradesDto } from './dto/bulk-enter-grades.dto.js';
import type { CreateAssessmentDto } from './dto/create-assessment.dto.js';
import type { UpdateAssessmentDto } from './dto/update-assessment.dto.js';

const assessmentInclude = { subject: true, classGroup: true, academicYear: true };

@Injectable()
export class GradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  async createAssessment(schoolId: string, dto: CreateAssessmentDto) {
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);

    return this.prisma.assessment.create({
      data: {
        title: dto.title,
        type: dto.type,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        maxScore: dto.maxScore ?? 20,
        date: new Date(dto.date),
      },
      include: assessmentInclude,
    });
  }

  findAssessments(schoolId: string, filters: { classGroupId?: string; subjectId?: string; academicYearId?: string }) {
    return this.prisma.assessment.findMany({
      where: { classGroup: { schoolId }, ...filters },
      include: assessmentInclude,
      orderBy: { date: 'desc' },
    });
  }

  async findAssessment(schoolId: string, id: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id, classGroup: { schoolId } },
      include: assessmentInclude,
    });
    if (!assessment) {
      throw new NotFoundException('Évaluation introuvable.');
    }
    return assessment;
  }

  async updateAssessment(schoolId: string, id: string, dto: UpdateAssessmentDto) {
    await this.findAssessment(schoolId, id);
    return this.prisma.assessment.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
      include: assessmentInclude,
    });
  }

  async removeAssessment(schoolId: string, id: string) {
    await this.findAssessment(schoolId, id);
    await this.prisma.assessment.delete({ where: { id } });
  }

  async enterGrades(schoolId: string, assessmentId: string, dto: BulkEnterGradesDto) {
    const assessment = await this.findAssessment(schoolId, assessmentId);

    const invalid = dto.entries.find((entry) => entry.score > assessment.maxScore);
    if (invalid) {
      throw new BadRequestException(
        `La note de ${invalid.score} dépasse le maximum autorisé (${assessment.maxScore}).`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      for (const entry of dto.entries) {
        const existing = await tx.grade.findFirst({
          where: { assessmentId, studentId: entry.studentId },
        });
        if (existing) {
          await tx.grade.update({
            where: { id: existing.id },
            data: { score: entry.score, comment: entry.comment },
          });
        } else {
          await tx.grade.create({
            data: { assessmentId, studentId: entry.studentId, score: entry.score, comment: entry.comment },
          });
        }
      }
    });

    return this.gradesForAssessment(schoolId, assessmentId);
  }

  async gradesForAssessment(schoolId: string, assessmentId: string) {
    await this.findAssessment(schoolId, assessmentId);
    return this.prisma.grade.findMany({
      where: { assessmentId },
      include: { student: { include: { user: true } } },
    });
  }

  async gradesForStudent(schoolId: string, requester: Requester, studentId: string, academicYearId?: string) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);
    return this.prisma.grade.findMany({
      where: {
        studentId,
        assessment: {
          classGroup: { schoolId },
          ...(academicYearId ? { academicYearId } : {}),
        },
      },
      include: { assessment: { include: assessmentInclude } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reportCard(schoolId: string, requester: Requester, studentId: string, academicYearId: string) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);

    const grades = await this.prisma.grade.findMany({
      where: { studentId, assessment: { classGroup: { schoolId }, academicYearId } },
      include: { assessment: { include: { subject: true } } },
    });

    const bySubject = new Map<string, { subjectName: string; ratios: number[] }>();
    for (const grade of grades) {
      const subjectId = grade.assessment.subjectId;
      const ratio = grade.score / grade.assessment.maxScore;
      const entry = bySubject.get(subjectId) ?? {
        subjectName: grade.assessment.subject.name,
        ratios: [],
      };
      entry.ratios.push(ratio);
      bySubject.set(subjectId, entry);
    }

    const subjects = Array.from(bySubject.entries()).map(([subjectId, { subjectName, ratios }]) => ({
      subjectId,
      subjectName,
      average: this.round(this.average(ratios) * 20),
      assessmentCount: ratios.length,
    }));

    const overallRatios = grades.map((g) => g.score / g.assessment.maxScore);

    return {
      studentId,
      academicYearId,
      subjects,
      overallAverage: this.round(this.average(overallRatios) * 20),
    };
  }

  private average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }
}
