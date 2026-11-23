import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateRoomDto } from './dto/create-room.dto.js';
import type { UpdateRoomDto } from './dto/update-room.dto.js';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateRoomDto) {
    try {
      return await this.prisma.room.create({ data: { schoolId, ...dto } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une salle avec ce nom existe déjà.');
      }
      throw error;
    }
  }

  findAll(schoolId: string) {
    return this.prisma.room.findMany({ where: { schoolId }, orderBy: { name: 'asc' } });
  }

  async findOne(schoolId: string, id: string) {
    const room = await this.prisma.room.findFirst({ where: { id, schoolId } });
    if (!room) {
      throw new NotFoundException('Salle introuvable.');
    }
    return room;
  }

  async update(schoolId: string, id: string, dto: UpdateRoomDto) {
    await this.findOne(schoolId, id);
    try {
      return await this.prisma.room.update({ where: { id }, data: dto });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une salle avec ce nom existe déjà.');
      }
      throw error;
    }
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.room.delete({ where: { id } });
  }
}
