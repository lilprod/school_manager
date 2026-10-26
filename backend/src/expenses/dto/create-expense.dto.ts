import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Fournitures' })
  @IsString()
  category!: string;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ required: false, description: 'Par défaut XOF' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, description: 'Par défaut, maintenant' })
  @IsOptional()
  @IsDateString()
  date?: string;
}
