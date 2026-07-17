import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PageLayoutModule } from '../page-layout/page-layout.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  // ChatbotModule exports ChatbotService so PostService can call indexPost().
  imports: [PageLayoutModule, ChatbotModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
