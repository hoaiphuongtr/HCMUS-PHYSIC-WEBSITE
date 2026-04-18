import { Module } from '@nestjs/common';
import { VisitorController } from './visitor.controller';
import { VisitorService } from './visitor.service';
import { VisitorRepository } from './visitor.repo';

@Module({
  controllers: [VisitorController],
  providers: [VisitorService, VisitorRepository],
  exports: [VisitorRepository],
})
export class VisitorModule {}
