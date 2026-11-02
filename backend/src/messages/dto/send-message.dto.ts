import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  recipientId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;
}
