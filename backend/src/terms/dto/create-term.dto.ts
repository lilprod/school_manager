import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateTermDto {
  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ example: 'Trimestre 1' })
  @IsString()
  name!: string;

  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}
