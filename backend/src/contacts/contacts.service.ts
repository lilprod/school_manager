import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

const MAX_RESULTS = 50;

const contactSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
  schoolId: true,
  school: { select: { name: true } },
  teacherProfile: { select: { id: true } },
} as const;

type ContactRow = Prisma.UserGetPayload<{ select: typeof contactSelect }>;

function present(user: ContactRow) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    schoolId: user.schoolId,
    schoolName: user.school?.name ?? null,
    teacherProfileId: user.teacherProfile?.id ?? null,
  };
}

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  /**
   * Annuaire des personnes que l'utilisateur peut contacter (mêmes règles de
   * périmètre que la messagerie ; l'envoi reste contrôlé côté MessagesService).
   */
  async findContacts(user: AuthenticatedUser, query: { q?: string; role?: string }) {
    const search: Prisma.UserWhereInput = query.q
      ? {
          OR: [
            { firstName: { contains: query.q, mode: 'insensitive' } },
            { lastName: { contains: query.q, mode: 'insensitive' } },
            { email: { contains: query.q, mode: 'insensitive' } },
          ],
        }
      : {};
    const roleFilter: Prisma.UserWhereInput =
      query.role === 'ADMIN' || query.role === 'TEACHER' || query.role === 'STUDENT' || query.role === 'PARENT'
        ? { role: query.role }
        : {};

    let scope: Prisma.UserWhereInput;

    if (user.role === 'PARENT') {
      const schoolIds = await this.schoolIdsOfChildren(user.id);
      scope = { schoolId: { in: schoolIds }, role: { in: ['ADMIN', 'TEACHER'] } };
    } else if (user.schoolId) {
      const allowedRoles = user.role === 'STUDENT' ? (['ADMIN', 'TEACHER'] as const) : null;
      scope = allowedRoles
        ? { schoolId: user.schoolId, role: { in: [...allowedRoles] } }
        : {
            OR: [
              { schoolId: user.schoolId },
              { role: 'PARENT', parentProfile: { children: { some: { student: { user: { schoolId: user.schoolId } } } } } },
            ],
          };
    } else {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { AND: [scope, search, roleFilter, { isActive: true }, { id: { not: user.id } }] },
      select: contactSelect,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: MAX_RESULTS,
    });
    return users.map(present);
  }

  /** Enseignants affectés à la classe actuelle d'un élève (pour une demande de rendez-vous). */
  async findTeachersOfStudent(user: AuthenticatedUser, studentId: string) {
    await this.studentAccess.assertCanView(user.schoolId, user, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    if (!enrollment) {
      return [];
    }

    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { classGroupId: enrollment.classGroupId, academicYearId: enrollment.academicYearId },
      include: { teacher: { include: { user: true } }, subject: true },
    });

    const byTeacher = new Map<
      string,
      { teacherId: string; userId: string; firstName: string; lastName: string; subjects: string[] }
    >();
    for (const a of assignments) {
      const entry = byTeacher.get(a.teacherId) ?? {
        teacherId: a.teacherId,
        userId: a.teacher.userId,
        firstName: a.teacher.user.firstName,
        lastName: a.teacher.user.lastName,
        subjects: [],
      };
      entry.subjects.push(a.subject.name);
      byTeacher.set(a.teacherId, entry);
    }
    return Array.from(byTeacher.values());
  }

  private async schoolIdsOfChildren(parentUserId: string): Promise<string[]> {
    const children = await this.prisma.studentProfile.findMany({
      where: { guardians: { some: { parent: { userId: parentUserId } } } },
      select: { user: { select: { schoolId: true } } },
    });
    return Array.from(
      new Set(children.map((c) => c.user.schoolId).filter((id): id is string => id !== null)),
    );
  }
}
