import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AssignTeacherDto {
  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;
}
