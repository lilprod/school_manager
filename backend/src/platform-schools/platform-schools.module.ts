import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PlatformSchoolsController } from './platform-schools.controller.js';
import { PlatformSchoolsService } from './platform-schools.service.js';

@Module({
  imports: [
    // Scoped to this module rather than registered globally in AppModule,
    // since only POST /platform/schools/signup should be rate-limited.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 900000, limit: 5 }]),
  ],
  controllers: [PlatformSchoolsController],
  providers: [PlatformSchoolsService],
  exports: [PlatformSchoolsService],
})
export class PlatformSchoolsModule {}
