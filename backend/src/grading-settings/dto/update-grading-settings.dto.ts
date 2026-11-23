import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

export class UpdateGradingSettingsDto {
  @ApiProperty({ example: 16, description: 'Moyenne minimale pour les félicitations' })
  @IsNumber()
  @Min(0)
  @Max(20)
  congratulationsMin!: number;

  @ApiProperty({ example: 14, description: 'Moyenne minimale pour les encouragements' })
  @IsNumber()
  @Min(0)
  @Max(20)
  encouragementsMin!: number;

  @ApiProperty({ example: 12, description: "Moyenne minimale pour le tableau d'honneur" })
  @IsNumber()
  @Min(0)
  @Max(20)
  honorRollMin!: number;

  @ApiProperty({ example: 8, description: "Une moyenne strictement inférieure déclenche l'avertissement" })
  @IsNumber()
  @Min(0)
  @Max(20)
  warningBelow!: number;
}
