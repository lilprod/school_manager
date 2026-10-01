import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TransferStudentDto {
  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  academicYearId!: string;
}
