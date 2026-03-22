import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { WidgetService } from './widget.service';
import { WidgetRepository } from './widget.repo';

@Module({
  controllers: [WidgetController],
  providers: [WidgetService, WidgetRepository],
  exports: [WidgetRepository],
})
export class WidgetModule {}
