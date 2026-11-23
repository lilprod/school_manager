import { ApiProperty } from '@nestjs/swagger';
import { AnnouncementAudience } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  content!: string;

  @ApiProperty({ required: false, enum: AnnouncementAudience, default: AnnouncementAudience.ALL })
  @IsOptional()
  @IsEnum(AnnouncementAudience)
  audience?: AnnouncementAudience;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  classGroupId?: string;
}
