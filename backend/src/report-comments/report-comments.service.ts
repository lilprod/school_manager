import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SaveReportCommentDto } from './dto/save-report-comment.dto.js';

@Injectable()
export class ReportCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ADMIN : appréciation générale ou par matière.
   * TEACHER : uniquement par matière, pour une matière qu'il enseigne à la
   * classe de l'élève.
   */
  async save(schoolId: string, user: AuthenticatedUser, dto: SaveReportCommentDto) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: dto.studentId, user: { schoolId } },
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId: dto.studentId, academicYearId: dto.academicYearId },
      orderBy: { createdAt: 'desc' },
    });
    if (!enrollment) {
      throw new NotFoundException("Cet élève n'est pas inscrit pour cette année.");
    }
    if (dto.termId) {
      const term = await this.prisma.term.findFirst({
        where: { id: dto.termId, schoolId, academicYearId: dto.academicYearId },
      });
      if (!term) {
        throw new NotFoundException('Trimestre introuvable pour cette année.');
      }
    }
    if (dto.subjectId) {
      const subject = await this.prisma.subject.findFirst({ where: { id: dto.subjectId, schoolId } });
      if (!subject) {
        throw new NotFoundException('Matière introuvable.');
      }
    }
    if (user.role === 'TEACHER') {
      await this.assertTeachesSubject(user.id, enrollment.classGroupId, enrollment.academicYearId, dto.subjectId);
    }

    const key = {
      studentId: dto.studentId,
      academicYearId: dto.academicYearId,
      termId: dto.termId ?? null,
      subjectId: dto.subjectId ?? null,
    };
    const existing = await this.prisma.reportComment.findFirst({ where: key });
    const text = dto.comment.trim();

    if (text === '') {
      if (existing) {
        await this.prisma.reportComment.delete({ where: { id: existing.id } });
      }
      return { deleted: Boolean(existing) };
    }
    if (existing) {
      return this.prisma.reportComment.update({
        where: { id: existing.id },
        data: { comment: text, authorId: user.id },
      });
    }
    return this.prisma.reportComment.create({ data: { ...key, comment: text, authorId: user.id } });
  }

  /** Appréciations déjà saisies pour une classe (écran de saisie). */
  async findForClass(
    schoolId: string,
    query: { classGroupId: string; academicYearId: string; termId?: string; subjectId?: string },
  ) {
    return this.prisma.reportComment.findMany({
      where: {
        academicYearId: query.academicYearId,
        termId: query.termId ?? null,
        subjectId: query.subjectId ?? null,
        student: {
          user: { schoolId },
          enrollments: { some: { classGroupId: query.classGroupId, academicYearId: query.academicYearId } },
        },
      },
      select: { id: true, studentId: true, comment: true },
    });
  }

  private async assertTeachesSubject(
    userId: string,
    classGroupId: string,
    academicYearId: string,
    subjectId: string | undefined,
  ) {
    if (!subjectId) {
      throw new ForbiddenException("Seul un administrateur peut saisir l'appréciation générale.");
    }
    const teacher = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    const assignment = teacher
      ? await this.prisma.teacherAssignment.findFirst({
          where: { teacherId: teacher.id, classGroupId, subjectId, academicYearId },
        })
      : null;
    if (!assignment) {
      throw new ForbiddenException("Vous n'enseignez pas cette matière à cette classe.");
    }
  }
}
