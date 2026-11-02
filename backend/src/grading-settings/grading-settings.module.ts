import { Module } from '@nestjs/common';
import { GradingSettingsController } from './grading-settings.controller.js';
import { GradingSettingsService } from './grading-settings.service.js';

@Module({
  controllers: [GradingSettingsController],
  providers: [GradingSettingsService],
})
export class GradingSettingsModule {}
