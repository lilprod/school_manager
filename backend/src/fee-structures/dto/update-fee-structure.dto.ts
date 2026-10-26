import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateFeeStructureDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  academicYearId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  classGroupId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}
