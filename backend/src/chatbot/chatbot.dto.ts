import { createZodDto } from 'nestjs-zod';
import { AskBodySchema, TrainBodySchema } from './chatbot.model';

export class AskBodyDTO extends createZodDto(AskBodySchema) {}
export class TrainBodyDTO extends createZodDto(TrainBodySchema) {}
