import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateTimetableSlotDto } from './dto/create-timetable-slot.dto.js';

interface TimetableQuery {
  classGroupId?: string;
  teacherId?: string;
  academicYearId?: string;
}

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateTimetableSlotDto) {
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);
    await this.assertSubjectInSchool(schoolId, dto.subjectId);
    await this.assertTeacherInSchool(schoolId, dto.teacherId);
    await this.assertAcademicYearInSchool(schoolId, dto.academicYearId);
    if (dto.roomId) {
      await this.assertRoomInSchool(schoolId, dto.roomId);
    }

    await this.assertNoConflict(dto);

    return this.prisma.timetableSlot.create({ data: { ...dto } });
  }

  async findAll(schoolId: string, query: TimetableQuery) {
    return this.prisma.timetableSlot.findMany({
      where: {
        classGroup: { schoolId },
        classGroupId: query.classGroupId,
        teacherId: query.teacherId,
        academicYearId: query.academicYearId,
      },
      include: { classGroup: true, subject: true, teacher: true, room: true, academicYear: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findOne(schoolId: string, id: string) {
    const slot = await this.prisma.timetableSlot.findFirst({
      where: { id, classGroup: { schoolId } },
      include: { classGroup: true, subject: true, teacher: true, room: true, academicYear: true },
    });
    if (!slot) {
      throw new NotFoundException('Créneau introuvable.');
    }
    return slot;
  }

  async remove(schoolId: string, id: string) {
    const slot = await this.prisma.timetableSlot.findFirst({ where: { id, classGroup: { schoolId } } });
    if (!slot) {
      throw new NotFoundException('Créneau introuvable.');
    }
    await this.prisma.timetableSlot.delete({ where: { id } });
  }

  private async assertNoConflict(dto: CreateTimetableSlotDto) {
    const candidates = await this.prisma.timetableSlot.findMany({
      where: {
        dayOfWeek: dto.dayOfWeek,
        OR: [
          { teacherId: dto.teacherId },
          ...(dto.roomId ? [{ roomId: dto.roomId }] : []),
        ],
      },
    });

    const overlaps = candidates.some(
      (existing) => dto.startTime < existing.endTime && dto.endTime > existing.startTime,
    );

    if (overlaps) {
      throw new ConflictException(
        'Ce créneau chevauche un cours existant pour cet enseignant ou cette salle.',
      );
    }
  }

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }

  private async assertSubjectInSchool(schoolId: string, subjectId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id: subjectId, schoolId } });
    if (!subject) {
      throw new NotFoundException('Matière introuvable.');
    }
  }

  private async assertTeacherInSchool(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherId, user: { schoolId } },
    });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }
  }

  private async assertAcademicYearInSchool(schoolId: string, academicYearId: string) {
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: academicYearId, schoolId },
    });
    if (!academicYear) {
      throw new NotFoundException('Année académique introuvable.');
    }
  }

  private async assertRoomInSchool(schoolId: string, roomId: string) {
    const room = await this.prisma.room.findFirst({ where: { id: roomId, schoolId } });
    if (!room) {
      throw new NotFoundException('Salle introuvable.');
    }
  }
}
