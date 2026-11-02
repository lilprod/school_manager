import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { BillingPeriod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RecordPaymentDto } from './dto/record-payment.dto.js';
import type { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';

const subscriptionInclude = {
  plan: true,
  payments: { orderBy: { paidAt: 'desc' as const } },
};

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySchool(schoolId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { schoolId },
      include: subscriptionInclude,
    });
    if (!subscription) {
      throw new NotFoundException("Cette école n'a pas encore d'abonnement.");
    }
    return subscription;
  }

  async recordPayment(schoolId: string, recordedById: string, dto: RecordPaymentDto) {
    const subscription = await this.findBySchool(schoolId);

    const paidAt = dto.paidAt ? new Date(dto.paidAt) : new Date();
    const periodBase = subscription.currentPeriodEnd && subscription.currentPeriodEnd > new Date()
      ? subscription.currentPeriodEnd
      : new Date();
    const newPeriodEnd = addBillingPeriod(periodBase, subscription.plan.billingPeriod);

    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          subscriptionId: subscription.id,
          amount: dto.amount,
          currency: dto.currency ?? subscription.plan.currency,
          method: dto.method,
          reference: dto.reference,
          notes: dto.notes,
          recordedById,
          paidAt,
        },
      }),
      this.prisma.subscription.update({
        where: { schoolId },
        data: { status: 'ACTIVE', currentPeriodEnd: newPeriodEnd },
      }),
    ]);

    return this.findBySchool(schoolId);
  }

  async listPayments(schoolId: string) {
    const subscription = await this.findBySchool(schoolId);
    return subscription.payments;
  }

  async update(schoolId: string, dto: UpdateSubscriptionDto) {
    await this.findBySchool(schoolId);

    if (dto.planId) {
      const plan = await this.prisma.plan.findUnique({ where: { id: dto.planId } });
      if (!plan || !plan.isActive) {
        throw new BadRequestException("Ce plan n'existe pas ou n'est plus disponible.");
      }
    }

    await this.prisma.subscription.update({
      where: { schoolId },
      data: { planId: dto.planId, status: dto.status },
    });

    return this.findBySchool(schoolId);
  }
}

function addBillingPeriod(date: Date, period: BillingPeriod): Date {
  const result = new Date(date);
  if (period === 'YEARLY') {
    result.setFullYear(result.getFullYear() + 1);
  } else {
    result.setMonth(result.getMonth() + 1);
  }
  return result;
}
