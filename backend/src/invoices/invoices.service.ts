import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Invoice, InvoiceStatus } from '@prisma/client';
import { StudentAccessService, type Requester } from '../common/access/student-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateBulkInvoicesDto } from './dto/create-bulk-invoices.dto.js';
import type { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import type { RecordFeePaymentDto } from './dto/record-fee-payment.dto.js';

const invoiceInclude = {
  student: { include: { user: true } },
  feeStructure: true,
  payments: { orderBy: { paidAt: 'desc' as const } },
};

type InvoiceWithPayments = Invoice & { payments: { amount: number }[] };

/** Rounds to the cent to avoid floating point drift (e.g. 0.1 + 0.2). */
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumPayments(payments: { amount: number }[]): number {
  return roundMoney(payments.reduce((total, payment) => total + payment.amount, 0));
}

/**
 * Status as it should currently be displayed, without necessarily persisting it:
 * an invoice whose due date has passed while still PENDING/PARTIALLY_PAID reads
 * as OVERDUE even if nothing has triggered a recalculation since the due date.
 */
function deriveDisplayStatus(invoice: Pick<Invoice, 'status' | 'dueDate'>): InvoiceStatus {
  if (
    (invoice.status === 'PENDING' || invoice.status === 'PARTIALLY_PAID') &&
    invoice.dueDate.getTime() < Date.now()
  ) {
    return 'OVERDUE';
  }
  return invoice.status;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly studentAccess: StudentAccessService,
  ) {}

  async create(schoolId: string, dto: CreateInvoiceDto) {
    await this.assertStudentInSchool(schoolId, dto.studentId);

    let amount = dto.amount;
    let currency = dto.currency;

    if (dto.feeStructureId) {
      const feeStructure = await this.prisma.feeStructure.findFirst({
        where: { id: dto.feeStructureId, schoolId },
      });
      if (!feeStructure) {
        throw new NotFoundException('Barème de frais introuvable.');
      }
      amount = amount ?? feeStructure.amount;
      currency = currency ?? feeStructure.currency;
    }

    if (amount === undefined || amount === null) {
      throw new BadRequestException('amount est requis lorsque feeStructureId est absent.');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        studentId: dto.studentId,
        feeStructureId: dto.feeStructureId,
        amount,
        currency: currency ?? 'XOF',
        dueDate: new Date(dto.dueDate),
      },
      include: invoiceInclude,
    });

    return this.present(invoice);
  }

  async createBulkForClass(schoolId: string, dto: CreateBulkInvoicesDto) {
    const feeStructure = await this.prisma.feeStructure.findFirst({
      where: { id: dto.feeStructureId, schoolId },
    });
    if (!feeStructure) {
      throw new NotFoundException('Barème de frais introuvable.');
    }

    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, schoolId },
    });
    if (!classGroup) {
      throw new NotFoundException('Classe introuvable.');
    }

    const students = await this.prisma.studentProfile.findMany({
      where: {
        user: { schoolId },
        enrollments: { some: { classGroupId: dto.classGroupId, status: 'active' } },
      },
    });

    const dueDate = new Date(dto.dueDate);
    let created = 0;
    let skipped = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const student of students) {
        const existing = await tx.invoice.findFirst({
          where: { studentId: student.id, feeStructureId: dto.feeStructureId },
        });
        if (existing) {
          skipped += 1;
          continue;
        }

        await tx.invoice.create({
          data: {
            studentId: student.id,
            feeStructureId: dto.feeStructureId,
            amount: feeStructure.amount,
            currency: feeStructure.currency,
            dueDate,
          },
        });
        created += 1;
      }
    });

    return { created, skipped };
  }

  async findAll(
    schoolId: string,
    filters: { studentId?: string; status?: InvoiceStatus; classGroupId?: string } = {},
  ) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        student: {
          user: { schoolId },
          ...(filters.classGroupId
            ? { enrollments: { some: { classGroupId: filters.classGroupId } } }
            : {}),
        },
        studentId: filters.studentId,
      },
      include: invoiceInclude,
      orderBy: { dueDate: 'desc' },
    });

    const presented = invoices.map((invoice) => this.present(invoice));
    if (!filters.status) {
      return presented;
    }
    return presented.filter((invoice) => invoice.status === filters.status);
  }

  async findOne(schoolId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, student: { user: { schoolId } } },
      include: invoiceInclude,
    });
    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }
    return this.present(invoice);
  }

  async findForStudent(
    schoolId: string | null,
    requester: Requester,
    studentId: string,
    filters: { status?: InvoiceStatus } = {},
  ) {
    await this.studentAccess.assertCanView(schoolId, requester, studentId);

    const invoices = await this.prisma.invoice.findMany({
      where: { studentId },
      include: invoiceInclude,
      orderBy: { dueDate: 'desc' },
    });

    const presented = invoices.map((invoice) => this.present(invoice));
    if (!filters.status) {
      return presented;
    }
    return presented.filter((invoice) => invoice.status === filters.status);
  }

  async recordPayment(schoolId: string, recordedById: string, invoiceId: string, dto: RecordFeePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, student: { user: { schoolId } } },
      include: { payments: true },
    });
    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }
    if (invoice.status === 'CANCELLED') {
      throw new BadRequestException('Cette facture est annulée, aucun paiement ne peut y être enregistré.');
    }

    const paidSoFar = sumPayments(invoice.payments);
    const remaining = roundMoney(invoice.amount - paidSoFar);
    const requested = roundMoney(dto.amount);

    // A tiny epsilon absorbs floating point noise without letting a real overpayment through.
    if (requested - remaining > 1e-6) {
      throw new BadRequestException('Ce paiement dépasse le solde restant dû.');
    }

    await this.prisma.feePayment.create({
      data: {
        invoiceId,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference,
        recordedById,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined,
      },
    });

    await this.recalculateStatus(invoiceId);

    return this.findOne(schoolId, invoiceId);
  }

  /** Recomputes and persists an invoice's status from the sum of its payments. */
  private async recalculateStatus(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice || invoice.status === 'CANCELLED') {
      return;
    }

    const paid = sumPayments(invoice.payments);
    const amount = roundMoney(invoice.amount);

    let status: InvoiceStatus;
    if (paid <= 0) {
      status = 'PENDING';
    } else if (paid < amount) {
      status = 'PARTIALLY_PAID';
    } else {
      status = 'PAID';
    }

    if (status !== 'PAID' && invoice.dueDate.getTime() < Date.now()) {
      status = 'OVERDUE';
    }

    if (status !== invoice.status) {
      await this.prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
    }
  }

  private present(invoice: InvoiceWithPayments) {
    const paidAmount = sumPayments(invoice.payments);
    return {
      ...invoice,
      status: deriveDisplayStatus(invoice),
      paidAmount,
      balance: roundMoney(invoice.amount - paidAmount),
    };
  }

  private async assertStudentInSchool(schoolId: string, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentId, user: { schoolId } },
    });
    if (!student) {
      throw new NotFoundException('Élève introuvable.');
    }
  }
}
