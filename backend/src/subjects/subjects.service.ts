import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateSubjectDto } from './dto/create-subject.dto.js';
import type { UpdateSubjectDto } from './dto/update-subject.dto.js';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateSubjectDto) {
    try {
      return await this.prisma.subject.create({ data: { schoolId, ...dto } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une matière avec ce code existe déjà.');
      }
      throw error;
    }
  }

  findAll(schoolId: string) {
    return this.prisma.subject.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findOne(schoolId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId } });
    if (!subject) {
      throw new NotFoundException('Matière introuvable.');
    }
    return subject;
  }

  async update(schoolId: string, id: string, dto: UpdateSubjectDto) {
    await this.findOne(schoolId, id);
    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.subject.delete({ where: { id } });
  }
}
