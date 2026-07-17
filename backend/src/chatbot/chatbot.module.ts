import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { EmbeddingService } from './embedding.service';
import { LlmService } from './llm.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, EmbeddingService, LlmService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
