import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class UpdateExamSlotDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  classGroupId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(HHMM, { message: 'startTime doit être au format HH:mm' })
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Matches(HHMM, { message: 'endTime doit être au format HH:mm' })
  endTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  supervisorId?: string;
}
