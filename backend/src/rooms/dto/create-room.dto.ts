import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: 'Salle 101' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 30, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ example: 'Laboratoire', required: false })
  @IsOptional()
  @IsString()
  type?: string;
}
