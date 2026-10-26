import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BulkEnterGradesDto } from './dto/bulk-enter-grades.dto.js';
import type { CreateAssessmentDto } from './dto/create-assessment.dto.js';
import type { UpdateAssessmentDto } from './dto/update-assessment.dto.js';
import {
  computeReportCard,
  computeStanding,
  mentionFor,
  type GradeInput,
} from './report-card.js';

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

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, academicYearId },
      orderBy: { createdAt: 'desc' },
    });

    // Élèves classés avec lui : même classe, même année (hors transferts sortants).
    const classmateIds = enrollment
      ? (
          await this.prisma.enrollment.findMany({
            where: {
              classGroupId: enrollment.classGroupId,
              academicYearId,
              status: { not: 'transferred_out' },
            },
            select: { studentId: true },
          })
        ).map((e) => e.studentId)
      : [];
    const studentIds = Array.from(new Set([studentId, ...classmateIds]));

    const overrides = enrollment
      ? new Map(
          (
            await this.prisma.classSubjectCoefficient.findMany({
              where: { classGroupId: enrollment.classGroupId },
            })
          ).map((c) => [c.subjectId, c.coefficient]),
        )
      : new Map<string, number>();

    const inputsByStudent = await this.loadGradeInputs(studentIds, academicYearId, termId, overrides);

    const own = computeReportCard(inputsByStudent.get(studentId) ?? []);

    const averages = new Map<string, number>();
    for (const id of studentIds) {
      const inputs = inputsByStudent.get(id);
      if (inputs && inputs.length > 0) {
        averages.set(id, computeReportCard(inputs).overallAverage);
      }
    }
    const standing = computeStanding(studentId, averages);

    const hasGrades = (inputsByStudent.get(studentId) ?? []).length > 0;
    const comments = await this.prisma.reportComment.findMany({
      where: { studentId, academicYearId, termId: termId ?? null },
    });

    return {
      studentId,
      academicYearId,
      termId: termId ?? null,
      ...own,
      rank: standing.rank,
      classSize: standing.classSize,
      classAverage: standing.classAverage,
      mention: hasGrades ? mentionFor(own.overallAverage) : null,
      generalComment: comments.find((c) => c.subjectId === null)?.comment ?? null,
      subjectComments: Object.fromEntries(
        comments.filter((c) => c.subjectId !== null).map((c) => [c.subjectId as string, c.comment]),
      ),
    };
  }

  /** Notes d'évaluations + devoirs corrigés comptés au bulletin, par élève. */
  private async loadGradeInputs(
    studentIds: string[],
    academicYearId: string,
    termId: string | undefined,
    coefficientOverrides: Map<string, number>,
  ): Promise<Map<string, GradeInput[]>> {
    const [grades, submissions] = await Promise.all([
      this.prisma.grade.findMany({
        where: {
          studentId: { in: studentIds },
          assessment: { academicYearId, ...(termId ? { termId } : {}) },
        },
        include: { assessment: { include: { subject: true } } },
      }),
      this.prisma.assignmentSubmission.findMany({
        where: {
          studentId: { in: studentIds },
          grade: { not: null },
          assignment: { academicYearId, countsInReport: true, ...(termId ? { termId } : {}) },
        },
        include: { assignment: { include: { subject: true } } },
      }),
    ]);

    const byStudent = new Map<string, GradeInput[]>();
    const push = (studentId: string, input: GradeInput) => {
      const list = byStudent.get(studentId) ?? [];
      list.push(input);
      byStudent.set(studentId, list);
    };
    const subjectCoefficient = (subject: { id: string; coefficient: number }) =>
      coefficientOverrides.get(subject.id) ?? subject.coefficient;

    for (const grade of grades) {
      push(grade.studentId, {
        score: grade.score,
        maxScore: grade.assessment.maxScore,
        assessmentCoefficient: grade.assessment.coefficient,
        subjectId: grade.assessment.subjectId,
        subjectName: grade.assessment.subject.name,
        subjectCoefficient: subjectCoefficient(grade.assessment.subject),
      });
    }
    for (const submission of submissions) {
      push(submission.studentId, {
        score: submission.grade as number,
        maxScore: submission.assignment.maxScore,
        assessmentCoefficient: submission.assignment.coefficient,
        subjectId: submission.assignment.subjectId,
        subjectName: submission.assignment.subject.name,
        subjectCoefficient: subjectCoefficient(submission.assignment.subject),
      });
    }
    return byStudent;
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
