import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateExamSessionDto {
  @ApiProperty({ example: 'Examens du 1er trimestre' })
  @IsString()
  name!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}
