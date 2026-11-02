import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, type InvoiceStatus } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { requireSchoolId } from '../common/utils/require-school-id.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateBulkInvoicesDto } from './dto/create-bulk-invoices.dto.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { RecordFeePaymentDto } from './dto/record-fee-payment.dto.js';
import { InvoicesService } from './invoices.service.js';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Roles(Role.ADMIN)
  @Post('invoices')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Post('invoices/bulk')
  createBulk(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBulkInvoicesDto) {
    return this.invoicesService.createBulkForClass(requireSchoolId(user), dto);
  }

  @Roles(Role.ADMIN)
  @Get('invoices')
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('studentId') studentId?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('classGroupId') classGroupId?: string,
  ) {
    return this.invoicesService.findAll(requireSchoolId(user), { studentId, status, classGroupId });
  }

  @Roles(Role.ADMIN)
  @Get('invoices/:id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invoicesService.findOne(requireSchoolId(user), id);
  }

  @Roles(Role.ADMIN)
  @Post('invoices/:id/payments')
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RecordFeePaymentDto,
  ) {
    return this.invoicesService.recordPayment(requireSchoolId(user), user.id, id, dto);
  }

  @Get('students/:studentId/invoices')
  findForStudent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.findForStudent(user.schoolId, user, studentId, { status });
  }
}
