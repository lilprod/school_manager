import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty({ example: 'Collège Molière' })
  @IsString()
  @MinLength(2)
  schoolName!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty()
  @IsEmail()
  adminEmail!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  adminPassword!: string;

  @ApiProperty()
  @IsString()
  adminFirstName!: string;

  @ApiProperty()
  @IsString()
  adminLastName!: string;

  @ApiProperty()
  @IsString()
  planId!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  activateImmediately?: boolean;
}
