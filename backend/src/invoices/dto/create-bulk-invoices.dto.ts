import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString } from 'class-validator';

export class CreateBulkInvoicesDto {
  @ApiProperty()
  @IsString()
  feeStructureId!: string;

  @ApiProperty()
  @IsString()
  classGroupId!: string;

  @ApiProperty()
  @IsDateString()
  dueDate!: string;
}
