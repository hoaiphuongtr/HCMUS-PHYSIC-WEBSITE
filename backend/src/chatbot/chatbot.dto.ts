import { createZodDto } from 'nestjs-zod';
import { AskBodySchema } from './chatbot.model';

export class AskBodyDTO extends createZodDto(AskBodySchema) {}
