import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateExamSlotDto {
  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty()
  @IsDateString()
  date!: string;

  @ApiProperty({ example: '08:00' })
  @Matches(HHMM, { message: 'startTime doit être au format HH:mm' })
  startTime!: string;

  @ApiProperty({ example: '10:00' })
  @Matches(HHMM, { message: 'endTime doit être au format HH:mm' })
  endTime!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ required: false, description: 'TeacherProfile.id' })
  @IsOptional()
  @IsString()
  supervisorId?: string;
}
