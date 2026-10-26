import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubjectDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, default: 1, description: 'Coefficient de la matière dans la moyenne générale' })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  coefficient?: number;
}
