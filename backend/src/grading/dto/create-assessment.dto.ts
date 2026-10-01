import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'Contrôle chapitre 3' })
  @IsString()
  title!: string;

  @ApiProperty({ enum: AssessmentType })
  @IsEnum(AssessmentType)
  type!: AssessmentType;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @ApiProperty()
  @IsDateString()
  date!: string;
}
