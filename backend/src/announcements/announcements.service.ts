import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AnnouncementAudience } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import type { CreateAnnouncementDto } from './dto/create-announcement.dto.js';

const authorSelect = {
  id: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, authorId: string, dto: CreateAnnouncementDto) {
    const audience = dto.audience ?? AnnouncementAudience.ALL;
    const author = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!author) {
      throw new NotFoundException('Auteur introuvable.');
    }

    if (dto.classGroupId) {
      const classGroup = await this.prisma.classGroup.findFirst({
        where: { id: dto.classGroupId, schoolId },
      });
      if (!classGroup) {
        throw new NotFoundException('Classe introuvable dans votre école.');
      }
    }

    if (author.role === 'TEACHER') {
      await this.assertTeacherCanTarget(authorId, audience, dto.classGroupId);
    }

    return this.prisma.announcement.create({
      data: {
        schoolId,
        authorId,
        title: dto.title,
        content: dto.content,
        audience,
        classGroupId: dto.classGroupId,
      },
      include: { author: { select: authorSelect } },
    });
  }

  async findAllForUser(schoolId: string, user: AuthenticatedUser) {
    if (user.role === 'ADMIN' || user.role === 'TEACHER') {
      return this.prisma.announcement.findMany({
        where: { schoolId },
        include: { author: { select: authorSelect } },
        orderBy: { publishedAt: 'desc' },
      });
    }

    const classGroupIds = await this.resolveClassGroupIds(schoolId, user);

    return this.prisma.announcement.findMany({
      where: {
        schoolId,
        OR: [
          { audience: AnnouncementAudience.ALL },
          { audience: this.roleToAudience(user.role) },
          ...(classGroupIds.length > 0 ? [{ classGroupId: { in: classGroupIds } }] : []),
        ],
      },
      include: { author: { select: authorSelect } },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async remove(schoolId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({ where: { id, schoolId } });
    if (!announcement) {
      throw new NotFoundException('Annonce introuvable.');
    }
    await this.prisma.announcement.delete({ where: { id } });
  }

  private roleToAudience(role: AuthenticatedUser['role']): AnnouncementAudience {
    if (role === 'STUDENT' || role === 'PARENT' || role === 'TEACHER' || role === 'ADMIN') {
      return AnnouncementAudience[role];
    }
    // SUPER_ADMIN n'a pas d'équivalent dans AnnouncementAudience : ne correspondra à aucune cible.
    return AnnouncementAudience.ALL;
  }

  private async resolveClassGroupIds(schoolId: string, user: AuthenticatedUser): Promise<string[]> {
    if (user.role === 'STUDENT') {
      const student = await this.prisma.studentProfile.findFirst({
        where: { userId: user.id, user: { schoolId } },
        include: { enrollments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      return student ? student.enrollments.map((e) => e.classGroupId) : [];
    }

    if (user.role === 'PARENT') {
      const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId: user.id } });
      if (!parentProfile) {
        return [];
      }
      const children = await this.prisma.studentProfile.findMany({
        where: { guardians: { some: { parentId: parentProfile.id } }, user: { schoolId } },
        include: { enrollments: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });
      return children.flatMap((child) => child.enrollments.map((e) => e.classGroupId));
    }

    return [];
  }

  private async assertTeacherCanTarget(
    authorId: string,
    audience: AnnouncementAudience,
    classGroupId?: string,
  ): Promise<void> {
    if (audience !== AnnouncementAudience.STUDENT && audience !== AnnouncementAudience.PARENT) {
      throw new ForbiddenException(
        'Un enseignant ne peut cibler que les élèves ou les parents d\'une classe qui lui est assignée.',
      );
    }
    if (!classGroupId) {
      throw new ForbiddenException('Un enseignant doit préciser la classe ciblée.');
    }

    const teacherProfile = await this.prisma.teacherProfile.findUnique({ where: { userId: authorId } });
    if (!teacherProfile) {
      throw new ForbiddenException('Profil enseignant introuvable.');
    }

    const assignment = await this.prisma.teacherAssignment.findFirst({
      where: { teacherId: teacherProfile.id, classGroupId },
    });
    if (!assignment) {
      throw new ForbiddenException('Vous n\'êtes pas assigné à cette classe.');
    }
  }
}
