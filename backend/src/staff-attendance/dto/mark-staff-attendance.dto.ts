import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class MarkStaffAttendanceDto {
  @ApiProperty()
  @IsString()
  teacherId!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
