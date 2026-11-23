import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateExpenseDto } from './dto/create-expense.dto.js';
import type { UpdateExpenseDto } from './dto/update-expense.dto.js';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(schoolId: string, recordedById: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        schoolId,
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency ?? 'XOF',
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
        recordedById,
      },
    });
  }

  async findAll(schoolId: string, filters: { category?: string; from?: string; to?: string } = {}) {
    return this.prisma.expense.findMany({
      where: {
        schoolId,
        category: filters.category,
        date: this.buildDateFilter(filters),
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(schoolId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({ where: { id, schoolId } });
    if (!expense) {
      throw new NotFoundException('Dépense introuvable.');
    }
    return expense;
  }

  async update(schoolId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(schoolId, id);
    return this.prisma.expense.update({
      where: { id },
      data: {
        category: dto.category,
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description,
        date: dto.date ? new Date(dto.date) : undefined,
      },
    });
  }

  async remove(schoolId: string, id: string) {
    await this.findOne(schoolId, id);
    await this.prisma.expense.delete({ where: { id } });
  }

  private buildDateFilter(filters: { from?: string; to?: string }) {
    if (!filters.from && !filters.to) {
      return undefined;
    }
    return {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
}
