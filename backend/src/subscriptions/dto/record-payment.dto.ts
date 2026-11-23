import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ required: false, description: 'Par défaut, la devise du plan' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ required: false, description: "Ex: identifiant de transaction mobile money" })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false, description: 'Par défaut, maintenant' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
