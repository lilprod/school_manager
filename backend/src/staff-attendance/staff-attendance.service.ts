import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { MarkStaffAttendanceDto } from './dto/mark-staff-attendance.dto.js';

interface StaffAttendanceQuery {
  teacherId?: string;
  date?: string;
  from?: string;
  to?: string;
}

const teacherSummarySelect = {
  id: true,
  employeeNumber: true,
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

@Injectable()
export class StaffAttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async mark(schoolId: string, recordedById: string, dto: MarkStaffAttendanceDto) {
    await this.assertTeacherInSchool(schoolId, dto.teacherId);

    const date = new Date(dto.date);
    const existing = await this.prisma.staffAttendance.findFirst({
      where: { teacherId: dto.teacherId, date },
    });

    if (existing) {
      return this.prisma.staffAttendance.update({
        where: { id: existing.id },
        data: { status: dto.status, note: dto.note, recordedById },
      });
    }

    return this.prisma.staffAttendance.create({
      data: {
        teacherId: dto.teacherId,
        date,
        status: dto.status,
        note: dto.note,
        recordedById,
      },
    });
  }

  async findAll(schoolId: string, requester: AuthenticatedUser, query: StaffAttendanceQuery) {
    let teacherId = query.teacherId;

    if (teacherId) {
      await this.assertAccessible(schoolId, requester, teacherId);
    } else if (requester.role === 'TEACHER') {
      teacherId = await this.getOwnTeacherProfileId(requester.id);
    }

    return this.prisma.staffAttendance.findMany({
      where: {
        teacher: { user: { schoolId } },
        teacherId,
        date: this.buildDateFilter(query),
      },
      include: { teacher: { select: teacherSummarySelect } },
      orderBy: { date: 'desc' },
    });
  }

  async summaryForTeacher(schoolId: string, requester: AuthenticatedUser, teacherId: string) {
    await this.assertAccessible(schoolId, requester, teacherId);

    const grouped = await this.prisma.staffAttendance.groupBy({
      by: ['status'],
      where: { teacherId },
      _count: { status: true },
    });

    return grouped.map((g) => ({ status: g.status, count: g._count.status }));
  }

  private buildDateFilter(query: StaffAttendanceQuery) {
    if (query.date) {
      return new Date(query.date);
    }
    if (query.from || query.to) {
      return {
        ...(query.from ? { gte: new Date(query.from) } : {}),
        ...(query.to ? { lte: new Date(query.to) } : {}),
      };
    }
    return undefined;
  }

  private async assertTeacherInSchool(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherId, user: { schoolId } },
    });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }
  }

  private async assertAccessible(schoolId: string, requester: AuthenticatedUser, teacherId: string) {
    await this.assertTeacherInSchool(schoolId, teacherId);

    if (requester.role === 'TEACHER') {
      const ownTeacherProfileId = await this.getOwnTeacherProfileId(requester.id);
      if (teacherId !== ownTeacherProfileId) {
        throw new ForbiddenException('Vous ne pouvez consulter que votre propre présence.');
      }
    }
  }

  private async getOwnTeacherProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ForbiddenException('Aucun profil enseignant associé à ce compte.');
    }
    return profile.id;
  }
}
