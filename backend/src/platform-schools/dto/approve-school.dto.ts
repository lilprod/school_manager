import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class ApproveSchoolDto {
  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty({ required: false, enum: ['ACTIVE', 'TRIALING'], default: 'ACTIVE' })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  trialEndsAt?: string;
}
