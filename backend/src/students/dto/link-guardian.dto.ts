import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LinkGuardianDto {
  @ApiProperty({ description: "ID du profil parent (ParentProfile)" })
  @IsString()
  parentProfileId!: string;

  @ApiProperty({ required: false, default: 'parent' })
  @IsOptional()
  @IsString()
  relation?: string;
}
