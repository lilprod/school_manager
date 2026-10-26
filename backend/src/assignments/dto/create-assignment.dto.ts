import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

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

  @ApiProperty({ required: false, default: false, description: 'Intègre la note corrigée au bulletin' })
  @IsOptional()
  @IsBoolean()
  countsInReport?: boolean;

  @ApiProperty({ required: false, default: 1, description: 'Poids dans la moyenne de la matière (si compté au bulletin)' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  coefficient?: number;

  @ApiProperty({ required: false, description: 'Trimestre auquel rattacher la note au bulletin' })
  @IsOptional()
  @IsString()
  termId?: string;
}
