import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SchoolStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ApproveSchoolDto } from './dto/approve-school.dto.js';
import type { CreateSchoolDto } from './dto/create-school.dto.js';
import type { SignupSchoolDto } from './dto/signup-school.dto.js';

const SALT_ROUNDS = 10;

const schoolInclude = {
  subscription: { include: { plan: true } },
};

@Injectable()
export class PlatformSchoolsService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(dto: SignupSchoolDto) {
    await this.assertEmailAvailable(dto.adminEmail);
    const plan = await this.prisma.plan.findUnique({ where: { code: dto.planCode } });
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Ce plan n\'existe pas ou n\'est plus disponible.');
    }

    const passwordHash = await bcrypt.hash(dto.adminPassword, SALT_ROUNDS);

    const school = await this.prisma.$transaction(async (tx) => {
      const createdSchool = await tx.school.create({
        data: {
          name: dto.schoolName,
          address: dto.address,
          phone: dto.phone,
          status: 'PENDING_APPROVAL',
          onboardingSource: 'SELF_SERVICE',
          requestedPlanId: plan.id,
        },
      });

      await tx.user.create({
        data: {
          schoolId: createdSchool.id,
          email: dto.adminEmail,
          passwordHash,
          role: 'ADMIN',
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
        },
      });

      return createdSchool;
    });

    return this.findOne(school.id);
  }

  async createManually(dto: CreateSchoolDto) {
    await this.assertEmailAvailable(dto.adminEmail);
    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Ce plan n\'existe pas ou n\'est plus disponible.');
    }

    const activate = dto.activateImmediately !== false;
    const passwordHash = await bcrypt.hash(dto.adminPassword, SALT_ROUNDS);

    const school = await this.prisma.$transaction(async (tx) => {
      const createdSchool = await tx.school.create({
        data: {
          name: dto.schoolName,
          address: dto.address,
          phone: dto.phone,
          status: activate ? 'ACTIVE' : 'PENDING_APPROVAL',
          onboardingSource: 'MANUAL',
          requestedPlanId: activate ? null : plan.id,
        },
      });

      await tx.user.create({
        data: {
          schoolId: createdSchool.id,
          email: dto.adminEmail,
          passwordHash,
          role: 'ADMIN',
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
        },
      });

      if (activate) {
        await tx.subscription.create({
          data: { schoolId: createdSchool.id, planId: plan.id, status: 'ACTIVE' },
        });
      }

      return createdSchool;
    });

    return this.findOne(school.id);
  }

  findAll(filters: { status?: SchoolStatus }) {
    return this.prisma.school.findMany({
      where: { status: filters.status },
      include: schoolInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        ...schoolInclude,
        _count: { select: { users: true, classGroups: true } },
      },
    });
    if (!school) {
      throw new NotFoundException('École introuvable.');
    }
    return school;
  }

  async approve(id: string, dto: ApproveSchoolDto) {
    const school = await this.findOne(id);
    if (school.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Seule une école en attente de validation peut être approuvée.');
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
    if (!plan || !plan.isActive) {
      throw new BadRequestException('Ce plan n\'existe pas ou n\'est plus disponible.');
    }

    await this.prisma.$transaction([
      this.prisma.subscription.create({
        data: {
          schoolId: id,
          planId: plan.id,
          status: dto.subscriptionStatus ?? 'ACTIVE',
          trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : undefined,
        },
      }),
      this.prisma.school.update({ where: { id }, data: { status: 'ACTIVE', requestedPlanId: null } }),
    ]);

    return this.findOne(id);
  }

  async suspend(id: string) {
    const school = await this.findOne(id);

    await this.prisma.$transaction([
      this.prisma.school.update({ where: { id }, data: { status: 'SUSPENDED' } }),
      ...(school.subscription
        ? [this.prisma.subscription.update({ where: { schoolId: id }, data: { status: 'SUSPENDED' } })]
        : []),
    ]);

    return this.findOne(id);
  }

  async reactivate(id: string) {
    const school = await this.findOne(id);
    if (!school.subscription) {
      throw new BadRequestException(
        "Cette école n'a pas encore d'abonnement — utilisez l'approbation plutôt que la réactivation.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.school.update({ where: { id }, data: { status: 'ACTIVE' } }),
      this.prisma.subscription.update({ where: { schoolId: id }, data: { status: 'ACTIVE' } }),
    ]);

    return this.findOne(id);
  }

  private async assertEmailAvailable(email: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà.');
    }
  }
}
