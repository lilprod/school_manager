import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ example: 'Devoir - exercices chapitre 4' })
  @IsString()
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;

  @ApiProperty({ required: false, default: 20, description: 'Note maximale du devoir' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxScore?: number;
}
