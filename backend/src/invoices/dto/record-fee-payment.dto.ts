import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordFeePaymentDto {
  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ required: false, description: 'Ex: identifiant de transaction mobile money' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false, description: 'Par défaut, maintenant' })
  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
