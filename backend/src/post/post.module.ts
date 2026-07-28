import { forwardRef, Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PageLayoutModule } from '../page-layout/page-layout.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  // ChatbotModule exports ChatbotService so PostService can call indexPost().
  // forwardRef: PageLayoutService also needs PostService (publish → sync post
  // status), so the two modules reference each other.
  imports: [forwardRef(() => PageLayoutModule), ChatbotModule],
  controllers: [PostController],
  providers: [PostService],
  exports: [PostService],
})
export class PostModule {}
