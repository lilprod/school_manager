import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
  @ApiProperty({ required: false, description: 'Soumission texte libre (pas de fichier en v1).' })
  @IsOptional()
  @IsString()
  content?: string;
}
