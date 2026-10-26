import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateClassGroupDto } from './dto/create-class-group.dto.js';
import type { UpdateClassGroupDto } from './dto/update-class-group.dto.js';

@Injectable()
export class ClassGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateClassGroupDto) {
    try {
      return await this.prisma.classGroup.create({ data: { schoolId, ...dto } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une classe avec ce nom existe déjà.');
      }
      throw error;
    }
  }

  findAll(schoolId: string) {
    return this.prisma.classGroup.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findOne(schoolId: string, id: string) {
    const classGroup = await this.prisma.classGroup.findFirst({ where: { id, schoolId } });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }
    return classGroup;
  }

  async update(schoolId: string, id: string, dto: UpdateClassGroupDto) {
    await this.findOne(schoolId, id);
    return this.prisma.classGroup.update({ where: { id }, data: dto });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.classGroup.delete({ where: { id } });
  }
}
