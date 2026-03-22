import { createZodDto } from 'nestjs-zod';
import {
  CreateWidgetBodySchema,
  UpdateWidgetBodySchema,
  WidgetResSchema,
} from './widget.model';

export class CreateWidgetBodyDTO extends createZodDto(CreateWidgetBodySchema) {}
export class UpdateWidgetBodyDTO extends createZodDto(UpdateWidgetBodySchema) {}
export class WidgetResDTO extends createZodDto(WidgetResSchema) {}
