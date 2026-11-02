import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateEvaluationDto {
  @ApiProperty()
  @IsNumber()
  score!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  evaluationDate?: string;
}
