import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateTimetableSlotDto {
  @ApiProperty({ example: 'clg1' })
  @IsString()
  classGroupId!: string;

  @ApiProperty({ example: 'sub1' })
  @IsString()
  subjectId!: string;

  @ApiProperty({ example: 'tch1' })
  @IsString()
  teacherId!: string;

  @ApiProperty({ example: 'room1', required: false })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiProperty({ example: 'ay1' })
  @IsString()
  academicYearId!: string;

  @ApiProperty({ example: 1, description: 'Lundi = 1 ... Dimanche = 7' })
  @IsInt()
  @Min(1)
  @Max(7)
  dayOfWeek!: number;

  @ApiProperty({ example: '08:00' })
  @Matches(TIME_PATTERN, { message: "startTime doit être au format HH:mm." })
  startTime!: string;

  @ApiProperty({ example: '09:00' })
  @Matches(TIME_PATTERN, { message: "endTime doit être au format HH:mm." })
  endTime!: string;
}
