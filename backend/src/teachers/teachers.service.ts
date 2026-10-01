import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AssignTeacherDto } from './dto/assign-teacher.dto.js';
import type { CreateTeacherDto } from './dto/create-teacher.dto.js';
import type { UpdateTeacherDto } from './dto/update-teacher.dto.js';

const SALT_ROUNDS = 10;

const teacherInclude = {
  user: true,
  assignments: { include: { classGroup: true, subject: true, academicYear: true } },
};

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateTeacherDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const teacherProfile = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            schoolId,
            email: dto.email,
            passwordHash,
            role: 'TEACHER',
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        });

        return tx.teacherProfile.create({
          data: {
            userId: user.id,
            employeeNumber: dto.employeeNumber,
            qualifications: dto.qualifications,
          },
        });
      });

      return this.findOne(schoolId, teacherProfile.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException("Ce numéro d'employé est déjà utilisé.");
      }
      throw error;
    }
  }

  async findAll(schoolId: string) {
    const teachers = await this.prisma.teacherProfile.findMany({
      where: { user: { schoolId } },
      include: teacherInclude,
      orderBy: { user: { lastName: 'asc' } },
    });
    return teachers.map((t) => this.sanitize(t));
  }

  async findOne(schoolId: string, id: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id, user: { schoolId } },
      include: teacherInclude,
    });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }
    return this.sanitize(teacher);
  }

  async update(schoolId: string, id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacherProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: teacher.userId },
        data: { firstName: dto.firstName, lastName: dto.lastName, phone: dto.phone },
      }),
      this.prisma.teacherProfile.update({
        where: { id },
        data: { qualifications: dto.qualifications },
      }),
    ]);

    return this.findOne(schoolId, id);
  }

  async assign(schoolId: string, id: string, dto: AssignTeacherDto) {
    const teacher = await this.prisma.teacherProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }

    try {
      await this.prisma.teacherAssignment.create({
        data: {
          teacherId: id,
          classGroupId: dto.classGroupId,
          subjectId: dto.subjectId,
          academicYearId: dto.academicYearId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Cette affectation existe déjà.');
      }
      throw error;
    }

    return this.findOne(schoolId, id);
  }

  async unassign(schoolId: string, id: string, assignmentId: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }
    await this.prisma.teacherAssignment.deleteMany({ where: { id: assignmentId, teacherId: id } });
    return this.findOne(schoolId, id);
  }

  async remove(schoolId: string, id: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!teacher) {
      throw new NotFoundException('Enseignant introuvable.');
    }
    await this.prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } });
  }

  private sanitize(teacher: { user: { passwordHash: string } & Record<string, unknown> } & Record<string, unknown>) {
    const { passwordHash, ...userRest } = teacher.user;
    return { ...teacher, user: userRest };
  }
}
