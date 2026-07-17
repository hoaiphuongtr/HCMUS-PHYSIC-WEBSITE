import { Body, Controller, Post } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { AskBodyDTO } from './chatbot.dto';
import { IsPublic } from '../shared/decorators/auth.decorator';
import { Roles } from '../shared/decorators/roles.decorator';
import { RoleName } from '../shared/constants/role.constants';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly service: ChatbotService) {}

  @Post('ask')
  @IsPublic()
  ask(@Body() body: AskBodyDTO) {
    return this.service.ask(body.question, body.language);
  }

  // Admin-only: rebuild the whole vector index.
  @Post('reindex')
  @Roles(RoleName.SuperAdmin)
  reindex() {
    return this.service.reindexAll();
  }
}
