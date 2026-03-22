import { Module } from '@nestjs/common';
import { WidgetModule } from '../widget/widget.module';
import { PageLayoutController } from './page-layout.controller';
import { PageLayoutService } from './page-layout.service';
import { PageLayoutRepository } from './page-layout.repo';

@Module({
  imports: [WidgetModule],
  controllers: [PageLayoutController],
  providers: [PageLayoutService, PageLayoutRepository],
})
export class PageLayoutModule {}
