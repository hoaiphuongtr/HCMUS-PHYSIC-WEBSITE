import { forwardRef, Module } from '@nestjs/common';
import { WidgetModule } from '../widget/widget.module';
import { NotificationModule } from '../notification/notification.module';
import { PageLayoutController } from './page-layout.controller';
import { PageLayoutService } from './page-layout.service';
import { PageLayoutRepository } from './page-layout.repo';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { PostModule } from '../post/post.module';

@Module({
  // forwardRef(PostModule): publish() syncs the linked post's status via
  // PostService, while PostModule needs PageLayoutRepository — mutual reference.
  imports: [
    WidgetModule,
    NotificationModule,
    ChatbotModule,
    forwardRef(() => PostModule),
  ],
  controllers: [PageLayoutController],
  providers: [PageLayoutService, PageLayoutRepository],
  exports: [PageLayoutRepository],
})
export class PageLayoutModule {}
