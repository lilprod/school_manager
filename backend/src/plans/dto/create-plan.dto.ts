import { ApiProperty } from '@nestjs/swagger';
import { BillingPeriod } from '@prisma/client';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'Standard' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'standard' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @Min(0)
  priceAmount!: number;

  @ApiProperty({ required: false, default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: BillingPeriod })
  @IsEnum(BillingPeriod)
  billingPeriod!: BillingPeriod;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeachers?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxClasses?: number;
}
