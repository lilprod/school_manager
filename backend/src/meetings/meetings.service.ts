import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { ParentTeacherMeeting } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import type { RequestMeetingDto } from './dto/request-meeting.dto.js';

const meetingInclude = {
  teacher: { include: { user: true } },
  parent: { include: { user: true } },
  student: { include: { user: true } },
} as const;

type MeetingWithRelations = ParentTeacherMeeting & {
  teacher: { userId: string; user: { schoolId: string | null } };
  parent: { userId: string };
};

@Injectable()
export class MeetingsService {
  constructor(private readonly prisma: PrismaService) {}

  async request(parentUserId: string, dto: RequestMeetingDto) {
    const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId: parentUserId } });
    if (!parentProfile) {
      throw new ForbiddenException('Profil parent introuvable.');
    }

    // Vérification du lien de tutelle (duplique volontairement la logique de
    // StudentAccessService pour éviter une dépendance croisée entre modules).
    const link = await this.prisma.parentStudent.findUnique({
      where: { parentId_studentId: { parentId: parentProfile.id, studentId: dto.studentId } },
    });
    if (!link) {
      throw new ForbiddenException('Vous ne pouvez demander un rendez-vous que pour votre propre enfant.');
    }

    const teacher = await this.prisma.teacherProfile.findUnique({ where: { id: dto.teacherId } });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }

    return this.prisma.parentTeacherMeeting.create({
      data: {
        teacherId: dto.teacherId,
        parentId: parentProfile.id,
        studentId: dto.studentId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        status: 'REQUESTED',
      },
      include: meetingInclude,
    });
  }

  async confirm(user: AuthenticatedUser, meetingId: string) {
    const meeting = await this.loadMeeting(meetingId);
    this.assertTeacherOrAdmin(user, meeting);
    return this.prisma.parentTeacherMeeting.update({
      where: { id: meetingId },
      data: { status: 'CONFIRMED' },
      include: meetingInclude,
    });
  }

  async cancel(user: AuthenticatedUser, meetingId: string) {
    const meeting = await this.loadMeeting(meetingId);
    this.assertTeacherOrAdmin(user, meeting);
    return this.prisma.parentTeacherMeeting.update({
      where: { id: meetingId },
      data: { status: 'CANCELLED' },
      include: meetingInclude,
    });
  }

  async complete(user: AuthenticatedUser, meetingId: string) {
    const meeting = await this.loadMeeting(meetingId);

    if (user.role === 'ADMIN') {
      if (!meeting.teacher.user.schoolId || meeting.teacher.user.schoolId !== user.schoolId) {
        throw new ForbiddenException('Cette réunion ne concerne pas votre école.');
      }
    } else if (user.role === 'TEACHER') {
      if (meeting.teacher.userId !== user.id) {
        throw new ForbiddenException('Cette réunion ne vous concerne pas.');
      }
    } else if (user.role === 'PARENT') {
      if (meeting.parent.userId !== user.id) {
        throw new ForbiddenException('Cette réunion ne vous concerne pas.');
      }
    } else {
      throw new ForbiddenException('Accès refusé.');
    }

    return this.prisma.parentTeacherMeeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED' },
      include: meetingInclude,
    });
  }

  async findAllForUser(user: AuthenticatedUser) {
    if (user.role === 'PARENT') {
      const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId: user.id } });
      if (!parentProfile) {
        return [];
      }
      return this.prisma.parentTeacherMeeting.findMany({
        where: { parentId: parentProfile.id },
        include: meetingInclude,
        orderBy: { scheduledAt: 'desc' },
      });
    }

    if (user.role === 'TEACHER') {
      const teacherProfile = await this.prisma.teacherProfile.findUnique({ where: { userId: user.id } });
      if (!teacherProfile) {
        return [];
      }
      return this.prisma.parentTeacherMeeting.findMany({
        where: { teacherId: teacherProfile.id },
        include: meetingInclude,
        orderBy: { scheduledAt: 'desc' },
      });
    }

    if (user.role === 'ADMIN') {
      const schoolId = requireSchoolId(user);
      return this.prisma.parentTeacherMeeting.findMany({
        where: { teacher: { user: { schoolId } } },
        include: meetingInclude,
        orderBy: { scheduledAt: 'desc' },
      });
    }

    return [];
  }

  private async loadMeeting(meetingId: string): Promise<MeetingWithRelations> {
    const meeting = await this.prisma.parentTeacherMeeting.findUnique({
      where: { id: meetingId },
      include: meetingInclude,
    });
    if (!meeting) {
      throw new NotFoundException('Réunion introuvable.');
    }
    return meeting;
  }

  private assertTeacherOrAdmin(user: AuthenticatedUser, meeting: MeetingWithRelations): void {
    if (user.role === 'ADMIN') {
      if (!meeting.teacher.user.schoolId || meeting.teacher.user.schoolId !== user.schoolId) {
        throw new ForbiddenException('Cette réunion ne concerne pas votre école.');
      }
      return;
    }
    if (user.role === 'TEACHER') {
      if (meeting.teacher.userId !== user.id) {
        throw new ForbiddenException('Cette réunion ne vous concerne pas.');
      }
      return;
    }
    throw new ForbiddenException('Accès refusé.');
  }
}
