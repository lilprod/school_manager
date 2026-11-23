import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class SetClassCoefficientDto {
  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsString()
  subjectId!: string;

  @ApiProperty({ description: 'Coefficient de la matière pour cette classe uniquement' })
  @IsNumber()
  @Min(0.1)
  coefficient!: number;
}
