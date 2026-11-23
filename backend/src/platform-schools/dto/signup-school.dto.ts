import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupSchoolDto {
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

  @ApiProperty({ example: 'starter' })
  @IsString()
  planCode!: string;
}
