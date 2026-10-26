import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SaveReportCommentDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ required: false, description: 'Absent : appréciation de l\'année complète' })
  @IsOptional()
  @IsString()
  termId?: string;

  @ApiProperty({ required: false, description: 'Absent : appréciation générale du bulletin' })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ description: 'Texte vide : supprime l\'appréciation' })
  @IsString()
  comment!: string;
}
