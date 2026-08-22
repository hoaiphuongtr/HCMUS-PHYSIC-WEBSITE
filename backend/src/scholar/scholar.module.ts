import { Module } from '@nestjs/common';
import { ScholarIntegrationController } from './integration.controller';
import { ResolveService } from './resolve/resolve.service';
import { ScholarController } from './scholar.controller';
import { ScholarService } from './scholar.service';
import { StaffPageService } from './staff-page.service';

@Module({
  controllers: [ScholarController, ScholarIntegrationController],
  providers: [ScholarService, ResolveService, StaffPageService],
  exports: [ScholarService],
})
export class ScholarModule {}
