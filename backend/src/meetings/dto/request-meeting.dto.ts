import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class RequestMeetingDto {
  @ApiProperty()
  @IsString()
  teacherId!: string;

  @ApiProperty()
  @IsString()
  studentId!: string;

  @ApiProperty()
  @IsDateString()
  scheduledAt!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
