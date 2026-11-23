import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DEFAULT_MENTION_THRESHOLDS,
  validateMentionThresholds,
  type MentionThresholds,
} from '../grading/report-card.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UpdateGradingSettingsDto } from './dto/update-grading-settings.dto.js';

@Injectable()
export class GradingSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Seuils de l'école, ou valeurs par défaut tant qu'ils n'ont pas été personnalisés. */
  async get(schoolId: string): Promise<MentionThresholds & { isCustom: boolean }> {
    const row = await this.prisma.gradingSettings.findUnique({ where: { schoolId } });
    if (!row) {
      return { ...DEFAULT_MENTION_THRESHOLDS, isCustom: false };
    }
    return {
      congratulationsMin: row.congratulationsMin,
      encouragementsMin: row.encouragementsMin,
      honorRollMin: row.honorRollMin,
      warningBelow: row.warningBelow,
      isCustom: true,
    };
  }

  async update(schoolId: string, dto: UpdateGradingSettingsDto) {
    const error = validateMentionThresholds(dto);
    if (error) {
      throw new BadRequestException(error);
    }
    const data = {
      congratulationsMin: dto.congratulationsMin,
      encouragementsMin: dto.encouragementsMin,
      honorRollMin: dto.honorRollMin,
      warningBelow: dto.warningBelow,
    };
    await this.prisma.gradingSettings.upsert({
      where: { schoolId },
      create: { schoolId, ...data },
      update: data,
    });
    return this.get(schoolId);
  }

  /** Retour aux seuils par défaut. */
  async reset(schoolId: string) {
    await this.prisma.gradingSettings.deleteMany({ where: { schoolId } });
    return this.get(schoolId);
  }
}
