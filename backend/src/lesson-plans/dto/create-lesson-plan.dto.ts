import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateLessonPlanDto {
  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 'Les fractions - introduction' })
  @IsString()
  title!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
