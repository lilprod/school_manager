import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserDto } from './dto/create-user.dto.js';
import type { UpdateUserDto } from './dto/update-user.dto.js';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        schoolId,
        email: dto.email,
        passwordHash,
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        locale: dto.locale ?? 'fr',
      },
    });

    return this.sanitize(user);
  }

  async findAll(schoolId: string) {
    const users = await this.prisma.user.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return users.map((user) => this.sanitize(user));
  }

  async findOne(schoolId: string, id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, schoolId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return this.sanitize(user);
  }

  async update(schoolId: string, id: string, dto: UpdateUserDto) {
    await this.findOne(schoolId, id);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return this.sanitize(user);
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.user.update({ where: { id }, data: { isActive: false } });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new UnauthorizedException('Mot de passe actuel incorrect.');
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  }

  private sanitize(user: { passwordHash: string } & Record<string, unknown>) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
