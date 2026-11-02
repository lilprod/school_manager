import { ApiProperty } from '@nestjs/swagger';
import { ContractType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateContractDto {
  @ApiProperty({ enum: ContractType })
  @IsEnum(ContractType)
  contractType!: ContractType;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  salaryAmount!: number;

  @ApiProperty({ required: false, default: 'XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
