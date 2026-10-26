import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BulkEnterGradesDto } from './dto/bulk-enter-grades.dto.js';
import type { CreateAssessmentDto } from './dto/create-assessment.dto.js';
import type { UpdateAssessmentDto } from './dto/update-assessment.dto.js';
import { computeReportCard } from './report-card.js';

const assessmentInclude = { subject: true, classGroup: true, academicYear: true, term: true };

@Injectable()
export class GradingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  async createAssessment(schoolId: string, dto: CreateAssessmentDto) {
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);
    if (dto.termId) {
      await this.assertTermInYear(schoolId, dto.termId, dto.academicYearId);
    }

    return this.prisma.assessment.create({
      data: {
        title: dto.title,
        type: dto.type,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        maxScore: dto.maxScore ?? 20,
        coefficient: dto.coefficient ?? 1,
        termId: dto.termId,
        date: new Date(dto.date),
      },
      include: assessmentInclude,
    });
  }

  findAssessments(schoolId: string, filters: { classGroupId?: string; subjectId?: string; academicYearId?: string; termId?: string }) {
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
    const existing = await this.findAssessment(schoolId, id);
    if (dto.termId) {
      await this.assertTermInYear(schoolId, dto.termId, existing.academicYearId);
    }
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

  async gradesForStudent(schoolId: string | null, requester: Requester, studentId: string, academicYearId?: string) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);
    return this.prisma.grade.findMany({
      where: {
        studentId,
        ...(academicYearId ? { assessment: { academicYearId } } : {}),
      },
      include: { assessment: { include: assessmentInclude } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reportCard(
    schoolId: string | null,
    requester: Requester,
    studentId: string,
    academicYearId: string,
    termId?: string,
  ) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);

    const grades = await this.prisma.grade.findMany({
      where: { studentId, assessment: { academicYearId, ...(termId ? { termId } : {}) } },
      include: { assessment: { include: { subject: true } } },
    });

    const result = computeReportCard(
      grades.map((grade) => ({
        score: grade.score,
        maxScore: grade.assessment.maxScore,
        assessmentCoefficient: grade.assessment.coefficient,
        subjectId: grade.assessment.subjectId,
        subjectName: grade.assessment.subject.name,
        subjectCoefficient: grade.assessment.subject.coefficient,
      })),
    );

    return { studentId, academicYearId, termId: termId ?? null, ...result };
  }

  private async assertTermInYear(schoolId: string, termId: string, academicYearId: string) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId, academicYearId } });
    if (!term) {
      throw new NotFoundException('Trimestre introuvable pour cette année académique.');
    }
  }

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }
}
