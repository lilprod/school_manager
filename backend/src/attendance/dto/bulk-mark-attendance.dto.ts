import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '@prisma/client';
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

class BulkAttendanceEntryDto {
  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

export class BulkMarkAttendanceDto {
  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty({ type: [BulkAttendanceEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceEntryDto)
  entries!: BulkAttendanceEntryDto[];
}
