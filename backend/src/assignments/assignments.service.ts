import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateAssignmentDto } from './dto/create-assignment.dto.js';
import type { GradeSubmissionDto } from './dto/grade-submission.dto.js';
import type { SubmitAssignmentDto } from './dto/submit-assignment.dto.js';

const assignmentInclude = {
  subject: true,
  classGroup: true,
  academicYear: true,
  createdBy: { include: { user: true } },
};
const submissionInclude = { student: { include: { user: true } } };

export interface AssignmentFilters {
  subjectId?: string;
  classGroupId?: string;
  academicYearId?: string;
}

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  async create(schoolId: string, userId: string, dto: CreateAssignmentDto) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);

    return this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        dueDate: new Date(dto.dueDate),
        createdById: teacherId,
      },
      include: assignmentInclude,
    });
  }

  findAll(schoolId: string, filters: AssignmentFilters) {
    return this.prisma.assignment.findMany({
      where: {
        classGroup: { schoolId },
        ...(filters.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters.classGroupId ? { classGroupId: filters.classGroupId } : {}),
        ...(filters.academicYearId ? { academicYearId: filters.academicYearId } : {}),
      },
      include: assignmentInclude,
      orderBy: { dueDate: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, classGroup: { schoolId } },
      include: assignmentInclude,
    });
    if (!assignment) {
      throw new NotFoundException('Devoir introuvable.');
    }
    return assignment;
  }

  async remove(schoolId: string, userId: string, id: string) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);
    const assignment = await this.findOne(schoolId, id);
    if (assignment.createdById !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que vos propres devoirs.');
    }
    await this.prisma.assignment.delete({ where: { id } });
  }

  /**
   * Un élève ne peut soumettre que pour un devoir ciblant une classe où il
   * est actuellement inscrit (Enrollment actif sur le même classGroup/année
   * scolaire que le devoir). Resoumission autorisée tant que la soumission
   * n'a pas encore été corrigée (grade === null), sinon 409.
   */
  async submit(userId: string, assignmentId: string, dto: SubmitAssignmentDto) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) {
      throw new ForbiddenException('Aucun profil élève associé à ce compte.');
    }

    const assignment = await this.prisma.assignment.findUnique({ where: { id: assignmentId } });
    if (!assignment) {
      throw new NotFoundException('Devoir introuvable.');
    }

    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        classGroupId: assignment.classGroupId,
        academicYearId: assignment.academicYearId,
        status: 'active',
      },
    });
    if (!enrollment) {
      throw new ForbiddenException("Vous n'êtes pas inscrit dans la classe concernée par ce devoir.");
    }

    const existing = await this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
    });

    if (existing) {
      if (existing.grade !== null) {
        throw new ConflictException('Ce devoir a déjà été corrigé.');
      }
      return this.prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: { content: dto.content, submittedAt: new Date() },
        include: submissionInclude,
      });
    }

    return this.prisma.assignmentSubmission.create({
      data: { assignmentId, studentId: student.id, content: dto.content },
      include: submissionInclude,
    });
  }

  async gradeSubmission(schoolId: string, userId: string, submissionId: string, dto: GradeSubmissionDto) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);

    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, assignment: { classGroup: { schoolId } } },
      include: { assignment: true },
    });
    if (!submission) {
      throw new NotFoundException('Soumission introuvable.');
    }
    if (submission.assignment.createdById !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez corriger que les devoirs que vous avez créés.');
    }

    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { grade: dto.grade, feedback: dto.feedback },
      include: submissionInclude,
    });
  }

  async findSubmissions(schoolId: string, userId: string, assignmentId: string) {
    const teacherId = await this.resolveTeacherId(schoolId, userId);
    const assignment = await this.findOne(schoolId, assignmentId);
    if (assignment.createdById !== teacherId) {
      throw new ForbiddenException('Vous ne pouvez consulter que les soumissions de vos propres devoirs.');
    }

    return this.prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: submissionInclude,
      orderBy: { submittedAt: 'desc' },
    });
  }

  async findMySubmission(userId: string, assignmentId: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { userId } });
    if (!student) {
      throw new ForbiddenException('Aucun profil élève associé à ce compte.');
    }
    return this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId: student.id } },
      include: submissionInclude,
    });
  }

  /**
   * Consultation de la soumission d'un élève donné pour un devoir donné,
   * ouverte à ADMIN/TEACHER (de l'école), à l'élève lui-même, et à son/ses
   * parent(s) quelle que soit l'école (voir StudentAccessService).
   */
  async submissionForStudent(schoolId: string | null, requester: Requester, assignmentId: string, studentId: string) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);
    return this.prisma.assignmentSubmission.findUnique({
      where: { assignmentId_studentId: { assignmentId, studentId } },
      include: submissionInclude,
    });
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
