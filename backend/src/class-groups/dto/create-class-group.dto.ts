import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateClassGroupDto {
  @ApiProperty({ example: '6ème A' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '6ème' })
  @IsString()
  level!: string;
}
