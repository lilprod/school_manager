import { Injectable, NotFoundException } from '@nestjs/common';
import type { AttendanceStatus, Prisma } from '@prisma/client';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { BulkMarkAttendanceDto } from './dto/bulk-mark-attendance.dto.js';
import type { MarkAttendanceDto } from './dto/mark-attendance.dto.js';
import type { UpdateAttendanceDto } from './dto/update-attendance.dto.js';

type DbClient = PrismaService | Prisma.TransactionClient;

interface AttendanceQuery {
  classGroupId?: string;
  studentId?: string;
  subjectId?: string;
  date?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  async mark(schoolId: string, recordedById: string, dto: MarkAttendanceDto) {
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);

    return this.upsertRecord(
      this.prisma,
      { studentId: dto.studentId, classGroupId: dto.classGroupId, subjectId: dto.subjectId, date: new Date(dto.date) },
      { status: dto.status, note: dto.note, recordedById },
    );
  }

  async bulkMark(schoolId: string, recordedById: string, dto: BulkMarkAttendanceDto) {
    await this.assertClassGroupInSchool(schoolId, dto.classGroupId);
    const date = new Date(dto.date);

    return this.prisma.$transaction((tx) =>
      Promise.all(
        dto.entries.map((entry) =>
          this.upsertRecord(
            tx,
            { studentId: entry.studentId, classGroupId: dto.classGroupId, subjectId: dto.subjectId, date },
            { status: entry.status, note: entry.note, recordedById },
          ),
        ),
      ),
    );
  }

  private async upsertRecord(
    db: DbClient,
    key: { studentId: string; classGroupId: string; subjectId?: string; date: Date },
    data: { status: AttendanceStatus; note?: string; recordedById: string },
  ) {
    const existing = await db.attendance.findFirst({
      where: {
        studentId: key.studentId,
        classGroupId: key.classGroupId,
        subjectId: key.subjectId ?? null,
        date: key.date,
      },
    });

    if (existing) {
      return db.attendance.update({
        where: { id: existing.id },
        data: { status: data.status, note: data.note, recordedById: data.recordedById },
      });
    }

    return db.attendance.create({
      data: {
        studentId: key.studentId,
        classGroupId: key.classGroupId,
        subjectId: key.subjectId,
        date: key.date,
        status: data.status,
        note: data.note,
        recordedById: data.recordedById,
      },
    });
  }

  async findAll(schoolId: string, query: AttendanceQuery) {
    return this.prisma.attendance.findMany({
      where: {
        classGroup: { schoolId },
        classGroupId: query.classGroupId,
        studentId: query.studentId,
        subjectId: query.subjectId,
        date: this.buildDateFilter(query),
      },
      include: { student: { include: { user: true } }, classGroup: true, subject: true },
      orderBy: { date: 'desc' },
    });
  }

  async findForStudent(schoolId: string, requester: Requester, studentId: string) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);
    return this.prisma.attendance.findMany({
      where: { studentId, classGroup: { schoolId } },
      include: { classGroup: true, subject: true },
      orderBy: { date: 'desc' },
    });
  }

  async summaryForStudent(schoolId: string, requester: Requester, studentId: string) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);
    const grouped = await this.prisma.attendance.groupBy({
      by: ['status'],
      where: { studentId, classGroup: { schoolId } },
      _count: { status: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count.status }));
  }

  async update(schoolId: string, id: string, dto: UpdateAttendanceDto) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, classGroup: { schoolId } },
    });
    if (!record) {
      throw new NotFoundException('Enregistrement de présence introuvable.');
    }
    return this.prisma.attendance.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, classGroup: { schoolId } },
    });
    if (!record) {
      throw new NotFoundException('Enregistrement de présence introuvable.');
    }
    await this.prisma.attendance.delete({ where: { id } });
  }

  private buildDateFilter(query: AttendanceQuery) {
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

  private async assertClassGroupInSchool(schoolId: string, classGroupId: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id: classGroupId, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
  }

}
