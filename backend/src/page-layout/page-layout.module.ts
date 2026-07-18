import { Module } from '@nestjs/common';
import { WidgetModule } from '../widget/widget.module';
import { PageLayoutController } from './page-layout.controller';
import { PageLayoutService } from './page-layout.service';
import { PageLayoutRepository } from './page-layout.repo';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [WidgetModule, ChatbotModule],
  controllers: [PageLayoutController],
  providers: [PageLayoutService, PageLayoutRepository],
  exports: [PageLayoutRepository],
})
export class PageLayoutModule {}
