import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

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
}
