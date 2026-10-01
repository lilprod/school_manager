import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateStudentDto } from './dto/create-student.dto.js';
import type { LinkGuardianDto } from './dto/link-guardian.dto.js';
import type { TransferStudentDto } from './dto/transfer-student.dto.js';
import type { UpdateStudentDto } from './dto/update-student.dto.js';

const SALT_ROUNDS = 10;

const studentInclude = {
  user: true,
  enrollments: {
    orderBy: { createdAt: 'desc' as const },
    take: 1,
    include: { classGroup: true, academicYear: true },
  },
  guardians: { include: { parent: { include: { user: true } } } },
};

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateStudentDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    try {
      const studentProfile = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            schoolId,
            email: dto.email,
            passwordHash,
            role: 'STUDENT',
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
          },
        });

        const profile = await tx.studentProfile.create({
          data: {
            userId: user.id,
            studentNumber: dto.studentNumber,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
            gender: dto.gender,
          },
        });

        await tx.enrollment.create({
          data: {
            studentId: profile.id,
            classGroupId: dto.classGroupId,
            academicYearId: dto.academicYearId,
          },
        });

        return profile;
      });

      return this.findOne(schoolId, studentProfile.id);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException("Ce numéro d'étudiant est déjà utilisé.");
      }
      throw error;
    }
  }

  async findAll(schoolId: string, classGroupId?: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: {
        user: { schoolId },
        ...(classGroupId
          ? { enrollments: { some: { classGroupId } } }
          : {}),
      },
      include: studentInclude,
      orderBy: { user: { lastName: 'asc' } },
    });
    return students.map((s) => this.sanitize(s));
  }

  async findOne(schoolId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, user: { schoolId } },
      include: studentInclude,
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }
    return this.sanitize(student);
  }

  async findMyProfile(schoolId: string, userId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { userId, user: { schoolId } },
      include: studentInclude,
    });
    if (!student) {
      throw new NotFoundException('Profil élève introuvable.');
    }
    return this.sanitize(student);
  }

  async findMyChildren(schoolId: string, parentUserId: string) {
    const parentProfile = await this.prisma.parentProfile.findFirst({
      where: { userId: parentUserId, user: { schoolId } },
    });
    if (!parentProfile) {
      return [];
    }
    const students = await this.prisma.studentProfile.findMany({
      where: { guardians: { some: { parentId: parentProfile.id } }, user: { schoolId } },
      include: studentInclude,
      orderBy: { user: { lastName: 'asc' } },
    });
    return students.map((s) => this.sanitize(s));
  }

  async update(schoolId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.studentProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: student.userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
        },
      }),
      this.prisma.studentProfile.update({
        where: { id },
        data: {
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
        },
      }),
    ]);

    return this.findOne(schoolId, id);
  }

  async transfer(schoolId: string, id: string, dto: TransferStudentDto) {
    const student = await this.prisma.studentProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }

    await this.prisma.enrollment.upsert({
      where: { studentId_academicYearId: { studentId: id, academicYearId: dto.academicYearId } },
      update: { classGroupId: dto.classGroupId, status: 'active' },
      create: { studentId: id, classGroupId: dto.classGroupId, academicYearId: dto.academicYearId },
    });

    return this.findOne(schoolId, id);
  }

  async linkGuardian(schoolId: string, id: string, dto: LinkGuardianDto) {
    const student = await this.prisma.studentProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }

    await this.prisma.parentStudent.upsert({
      where: {
        parentId_studentId: { parentId: dto.parentProfileId, studentId: id },
      },
      update: { relation: dto.relation ?? 'parent' },
      create: { parentId: dto.parentProfileId, studentId: id, relation: dto.relation ?? 'parent' },
    });

    return this.findOne(schoolId, id);
  }

  async remove(schoolId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }
    await this.prisma.user.update({ where: { id: student.userId }, data: { isActive: false } });
  }

  private sanitize(student: { user: { passwordHash: string } & Record<string, unknown> } & Record<string, unknown>) {
    const { passwordHash, ...userRest } = student.user;
    return { ...student, user: userRest };
  }
}
