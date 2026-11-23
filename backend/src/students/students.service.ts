import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import PDFDocument from 'pdfkit';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateStudentDto } from './dto/create-student.dto.js';
import type { LinkGuardianDto } from './dto/link-guardian.dto.js';
import type { TransferStudentDto } from './dto/transfer-student.dto.js';
import type { UpdateStudentDto } from './dto/update-student.dto.js';

const SALT_ROUNDS = 10;
const PHOTOS_DIR = join(process.cwd(), 'uploads', 'photos');

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
        user: { schoolId, isActive: true },
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

  async findMyChildren(parentUserId: string) {
    const parentProfile = await this.prisma.parentProfile.findFirst({
      where: { userId: parentUserId },
    });
    if (!parentProfile) {
      return [];
    }
    const students = await this.prisma.studentProfile.findMany({
      where: { guardians: { some: { parentId: parentProfile.id } } },
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

  async graduate(schoolId: string, id: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, user: { schoolId } },
      include: { enrollments: { orderBy: { createdAt: 'desc' as const }, take: 1 } },
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }

    const latestEnrollment = student.enrollments[0];

    await this.prisma.$transaction([
      ...(latestEnrollment
        ? [this.prisma.enrollment.update({ where: { id: latestEnrollment.id }, data: { status: 'graduated' } })]
        : []),
      this.prisma.user.update({ where: { id: student.userId }, data: { isActive: false } }),
    ]);
  }

  async uploadPhoto(schoolId: string, id: string, file: Express.Multer.File) {
    const student = await this.prisma.studentProfile.findFirst({ where: { id, user: { schoolId } } });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni.');
    }

    if (!existsSync(PHOTOS_DIR)) {
      mkdirSync(PHOTOS_DIR, { recursive: true });
    }

    const filename = `${student.id}-${Date.now()}${extname(file.originalname)}`;
    writeFileSync(join(PHOTOS_DIR, filename), file.buffer);
    const photoUrl = `/uploads/photos/${filename}`;

    await this.prisma.user.update({ where: { id: student.userId }, data: { photoUrl } });

    return this.findOne(schoolId, id);
  }

  async generateIdCardPdf(schoolId: string, id: string): Promise<Buffer> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, user: { schoolId } },
      include: {
        user: { include: { school: true } },
        enrollments: {
          orderBy: { createdAt: 'desc' as const },
          take: 1,
          include: { classGroup: true },
        },
      },
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }

    const schoolName = student.user.school?.name ?? 'École';
    const className = student.enrollments[0]?.classGroup?.name ?? 'N/A';
    const photoPath = student.user.photoUrl
      ? join(process.cwd(), student.user.photoUrl.replace(/^\//, ''))
      : null;

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: [240, 153], margin: 10 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error: Error) => reject(error));

      doc.fontSize(10).font('Helvetica-Bold').text(schoolName, 10, 10, { width: 220, align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').text("CARTE D'ÉLÈVE", { width: 220, align: 'center' });

      const textX = photoPath && existsSync(photoPath) ? 90 : 10;
      let y = 45;
      doc.fontSize(9).font('Helvetica-Bold').text(`${student.user.firstName} ${student.user.lastName}`, textX, y, {
        width: 220 - textX,
      });
      y += 20;
      doc.fontSize(8).font('Helvetica').text(`N° élève: ${student.studentNumber}`, textX, y, {
        width: 220 - textX,
      });
      y += 15;
      doc.text(`Classe: ${className}`, textX, y, { width: 220 - textX });

      if (photoPath && existsSync(photoPath)) {
        try {
          doc.image(photoPath, 10, 45, { fit: [70, 80] });
        } catch {
          // Corrupted or unreadable image file: skip it rather than fail the whole PDF.
        }
      }

      doc.end();
    });
  }

  private sanitize(student: { user: { passwordHash: string } & Record<string, unknown> } & Record<string, unknown>) {
    const { passwordHash, ...userRest } = student.user;
    return { ...student, user: userRest };
  }
}
