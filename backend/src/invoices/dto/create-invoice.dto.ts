import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty({ required: false, description: "Si fourni et amount absent, reprend le montant du barème" })
  @IsOptional()
  @IsString()
  feeStructureId?: string;

  @ApiProperty({ required: false, description: 'Requis si feeStructureId est absent' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false, description: 'Par défaut XOF, ou la devise du barème' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;
}
