import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { StudentAccessService } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateExamSessionDto } from './dto/create-exam-session.dto.js';
import type { CreateExamSlotDto } from './dto/create-exam-slot.dto.js';
import type { UpdateExamSessionDto } from './dto/update-exam-session.dto.js';
import type { UpdateExamSlotDto } from './dto/update-exam-slot.dto.js';
import { CONFLICT_MESSAGES, findSlotConflicts } from './exam-conflicts.js';

const slotInclude = {
  classGroup: true,
  subject: true,
  room: true,
  supervisor: { include: { user: { select: { firstName: true, lastName: true } } } },
} as const;

const dayStart = (value: string | Date) => new Date(new Date(value).toISOString().slice(0, 10));

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  // --- Sessions ---

  async createSession(schoolId: string, dto: CreateExamSessionDto) {
    const startDate = dayStart(dto.startDate);
    const endDate = dayStart(dto.endDate);
    this.assertRange(startDate, endDate);
    await this.assertYearInSchool(schoolId, dto.academicYearId);
    if (dto.termId) {
      await this.assertTermInYear(schoolId, dto.termId, dto.academicYearId);
    }

    return this.prisma.examSession.create({
      data: {
        schoolId,
        academicYearId: dto.academicYearId,
        termId: dto.termId,
        name: dto.name,
        startDate,
        endDate,
      },
      include: { term: true },
    });
  }

  findSessions(schoolId: string, query: { academicYearId?: string; termId?: string }) {
    return this.prisma.examSession.findMany({
      where: { schoolId, academicYearId: query.academicYearId, termId: query.termId },
      include: { term: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async updateSession(schoolId: string, id: string, dto: UpdateExamSessionDto) {
    const session = await this.getSession(schoolId, id);
    const startDate = dto.startDate ? dayStart(dto.startDate) : session.startDate;
    const endDate = dto.endDate ? dayStart(dto.endDate) : session.endDate;
    this.assertRange(startDate, endDate);
    if (dto.termId) {
      await this.assertTermInYear(schoolId, dto.termId, session.academicYearId);
    }

    const outside = await this.prisma.examSlot.findFirst({
      where: { sessionId: id, OR: [{ date: { lt: startDate } }, { date: { gt: endDate } }] },
    });
    if (outside) {
      throw new BadRequestException('Des créneaux existants sortent des nouvelles dates de la session.');
    }

    return this.prisma.examSession.update({
      where: { id },
      data: { name: dto.name, termId: dto.termId, startDate, endDate },
      include: { term: true },
    });
  }

  async removeSession(schoolId: string, id: string) {
    await this.getSession(schoolId, id);
    await this.prisma.examSession.delete({ where: { id } });
  }

  // --- Créneaux ---

  async createSlot(schoolId: string, sessionId: string, dto: CreateExamSlotDto) {
    const session = await this.getSession(schoolId, sessionId);
    const date = dayStart(dto.date);
    this.assertSlotShape(session, date, dto.startTime, dto.endTime);
    await this.assertReferences(schoolId, dto);
    await this.assertNoConflict(sessionId, date, { ...dto }, undefined);

    return this.prisma.examSlot.create({
      data: {
        sessionId,
        classGroupId: dto.classGroupId,
        subjectId: dto.subjectId,
        roomId: dto.roomId,
        supervisorId: dto.supervisorId,
        date,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: slotInclude,
    });
  }

  async findSlots(schoolId: string, sessionId: string, classGroupId?: string) {
    await this.getSession(schoolId, sessionId);
    return this.prisma.examSlot.findMany({
      where: { sessionId, classGroupId },
      include: slotInclude,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async updateSlot(schoolId: string, id: string, dto: UpdateExamSlotDto) {
    const slot = await this.getSlot(schoolId, id);
    const session = await this.getSession(schoolId, slot.sessionId);

    const merged = {
      classGroupId: dto.classGroupId ?? slot.classGroupId,
      subjectId: dto.subjectId ?? slot.subjectId,
      roomId: dto.roomId === undefined ? slot.roomId : dto.roomId || undefined,
      supervisorId: dto.supervisorId === undefined ? slot.supervisorId : dto.supervisorId || undefined,
      startTime: dto.startTime ?? slot.startTime,
      endTime: dto.endTime ?? slot.endTime,
    };
    const date = dto.date ? dayStart(dto.date) : slot.date;

    this.assertSlotShape(session, date, merged.startTime, merged.endTime);
    await this.assertReferences(schoolId, merged);
    await this.assertNoConflict(slot.sessionId, date, merged, id);

    return this.prisma.examSlot.update({
      where: { id },
      data: {
        classGroupId: merged.classGroupId,
        subjectId: merged.subjectId,
        roomId: merged.roomId ?? null,
        supervisorId: merged.supervisorId ?? null,
        date,
        startTime: merged.startTime,
        endTime: merged.endTime,
      },
      include: slotInclude,
    });
  }

  async removeSlot(schoolId: string, id: string) {
    await this.getSlot(schoolId, id);
    await this.prisma.examSlot.delete({ where: { id } });
  }

  /** Créneaux d'examen de la classe actuelle d'un élève (élève, ses parents, ou personnel de l'école). */
  async findForStudent(user: AuthenticatedUser, studentId: string, sessionId?: string) {
    await this.studentAccess.assertCanView(user.schoolId, user, studentId);

    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
    if (!enrollment) {
      return [];
    }

    return this.prisma.examSlot.findMany({
      where: { classGroupId: enrollment.classGroupId, sessionId },
      include: { ...slotInclude, session: true },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  // --- Helpers ---

  private assertRange(startDate: Date, endDate: Date) {
    if (startDate > endDate) {
      throw new BadRequestException('La date de début doit précéder la date de fin.');
    }
  }

  private assertSlotShape(
    session: { startDate: Date; endDate: Date },
    date: Date,
    startTime: string,
    endTime: string,
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException("L'heure de début doit précéder l'heure de fin.");
    }
    if (date < session.startDate || date > session.endDate) {
      throw new BadRequestException('La date doit être comprise dans la période de la session.');
    }
  }

  private async assertNoConflict(
    sessionId: string,
    date: Date,
    candidate: { classGroupId: string; roomId?: string | null; supervisorId?: string | null; startTime: string; endTime: string },
    ignoreSlotId: string | undefined,
  ) {
    // Les ressources (salle, surveillant) sont partagées entre sessions de l'école : on compare sur toute la journée.
    const sameDay = await this.prisma.examSlot.findMany({
      where: {
        date,
        ...(ignoreSlotId ? { id: { not: ignoreSlotId } } : {}),
        OR: [
          { classGroupId: candidate.classGroupId },
          ...(candidate.roomId ? [{ roomId: candidate.roomId }] : []),
          ...(candidate.supervisorId ? [{ supervisorId: candidate.supervisorId }] : []),
        ],
      },
    });
    void sessionId;

    const kinds = findSlotConflicts(candidate, sameDay);
    if (kinds.length > 0) {
      throw new ConflictException(`Conflit : ${kinds.map((k) => CONFLICT_MESSAGES[k]).join(' ; ')}.`);
    }
  }

  private async assertReferences(
    schoolId: string,
    refs: { classGroupId: string; subjectId: string; roomId?: string | null; supervisorId?: string | null },
  ) {
    const [classGroup, subject] = await Promise.all([
      this.prisma.classGroup.findFirst({ where: { id: refs.classGroupId, schoolId } }),
      this.prisma.subject.findFirst({ where: { id: refs.subjectId, schoolId } }),
    ]);
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
    if (!subject) {
      throw new NotFoundException('Matière introuvable.');
    }
    if (refs.roomId) {
      const room = await this.prisma.room.findFirst({ where: { id: refs.roomId, schoolId } });
      if (!room) {
        throw new NotFoundException('Salle introuvable.');
      }
    }
    if (refs.supervisorId) {
      const teacher = await this.prisma.teacherProfile.findFirst({
        where: { id: refs.supervisorId, user: { schoolId } },
      });
      if (!teacher) {
        throw new NotFoundException('Surveillant introuvable.');
      }
    }
  }

  private async getSession(schoolId: string, id: string) {
    const session = await this.prisma.examSession.findFirst({ where: { id, schoolId } });
    if (!session) {
      throw new NotFoundException("Session d'examen introuvable.");
    }
    return session;
  }

  private async getSlot(schoolId: string, id: string) {
    const slot = await this.prisma.examSlot.findFirst({ where: { id, session: { schoolId } } });
    if (!slot) {
      throw new NotFoundException("Créneau d'examen introuvable.");
    }
    return slot;
  }

  private async assertYearInSchool(schoolId: string, academicYearId: string) {
    const year = await this.prisma.academicYear.findFirst({ where: { id: academicYearId, schoolId } });
    if (!year) {
      throw new NotFoundException('Année académique introuvable.');
    }
  }

  private async assertTermInYear(schoolId: string, termId: string, academicYearId: string) {
    const term = await this.prisma.term.findFirst({ where: { id: termId, schoolId, academicYearId } });
    if (!term) {
      throw new NotFoundException('Trimestre introuvable pour cette année académique.');
    }
  }
}
