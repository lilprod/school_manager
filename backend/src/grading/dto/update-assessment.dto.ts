import { ApiProperty } from '@nestjs/swagger';
import { AssessmentType } from '@prisma/client';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAssessmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false, enum: AssessmentType })
  @IsOptional()
  @IsEnum(AssessmentType)
  type?: AssessmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;
}
