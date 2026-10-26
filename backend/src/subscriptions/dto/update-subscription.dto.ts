import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiProperty({ required: false, description: 'Changement de plan (upgrade/downgrade)' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiProperty({ required: false, enum: SubscriptionStatus })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;
}
