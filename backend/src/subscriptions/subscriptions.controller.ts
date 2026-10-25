import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { RecordPaymentDto } from './dto/record-payment.dto.js';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiTags('platform-subscriptions')
@ApiBearerAuth()
@Roles(Role.SUPER_ADMIN)
@Controller('platform/schools/:schoolId/subscription')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findBySchool(@Param('schoolId') schoolId: string) {
    return this.subscriptionsService.findBySchool(schoolId);
  }

  @Patch()
  update(@Param('schoolId') schoolId: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(schoolId, dto);
  }

  @Post('payments')
  recordPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('schoolId') schoolId: string,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.subscriptionsService.recordPayment(schoolId, user.id, dto);
  }

  @Get('payments')
  listPayments(@Param('schoolId') schoolId: string) {
    return this.subscriptionsService.listPayments(schoolId);
  }
}
