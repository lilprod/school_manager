import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface Requester {
  id: string;
  role: string;
}

@Injectable()
export class StudentAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanView(schoolId: string, requester: Requester, studentId: string): Promise<void> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, user: { schoolId } },
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }

    if (requester.role === 'ADMIN' || requester.role === 'TEACHER') {
      return;
    }

    if (requester.role === 'STUDENT') {
      if (student.userId !== requester.id) {
        throw new ForbiddenException('Vous ne pouvez consulter que vos propres données.');
      }
      return;
    }

    if (requester.role === 'PARENT') {
      const parentProfile = await this.prisma.parentProfile.findUnique({ where: { userId: requester.id } });
      const link = parentProfile
        ? await this.prisma.parentStudent.findUnique({
            where: { parentId_studentId: { parentId: parentProfile.id, studentId } },
          })
        : null;
      if (!link) {
        throw new ForbiddenException('Vous ne pouvez consulter que les données de vos enfants.');
      }
      return;
    }

    throw new ForbiddenException('Accès refusé.');
  }
}
