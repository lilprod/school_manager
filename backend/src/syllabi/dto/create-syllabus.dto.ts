import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateSyllabusDto {
  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;

  @ApiProperty({ example: 'Programme de mathématiques - Trimestre 1' })
  @IsString()
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
