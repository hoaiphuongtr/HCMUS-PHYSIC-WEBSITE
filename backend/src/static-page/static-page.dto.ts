import { createZodDto } from 'nestjs-zod';
import {
  StaticPageResSchema,
  StaticPageListResSchema,
  CreateStaticPageBodySchema,
  UpdateStaticPageBodySchema,
} from './static-page.model';

export class StaticPageResDTO extends createZodDto(StaticPageResSchema) {}
export class StaticPageListResDTO extends createZodDto(
  StaticPageListResSchema,
) {}
export class CreateStaticPageBodyDTO extends createZodDto(
  CreateStaticPageBodySchema,
) {}
export class UpdateStaticPageBodyDTO extends createZodDto(
  UpdateStaticPageBodySchema,
) {}
