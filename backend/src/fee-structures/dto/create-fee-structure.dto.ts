import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFeeStructureDto {
  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ required: false, description: 'Si absent, le barème s\'applique à toute l\'école' })
  @IsOptional()
  @IsString()
  classGroupId?: string;

  @ApiProperty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ required: false, description: 'Par défaut XOF' })
  @IsOptional()
  @IsString()
  currency?: string;
}
