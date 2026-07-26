import { createZodDto } from 'nestjs-zod';
import {
  TagResSchema,
  TagListResSchema,
  CreateTagBodySchema,
  UpdateTagBodySchema,
  MergeTagBodySchema,
} from './tag.model';

export class TagResDTO extends createZodDto(TagResSchema) {}
export class TagListResDTO extends createZodDto(TagListResSchema) {}
export class CreateTagBodyDTO extends createZodDto(CreateTagBodySchema) {}
export class UpdateTagBodyDTO extends createZodDto(UpdateTagBodySchema) {}
export class MergeTagBodyDTO extends createZodDto(MergeTagBodySchema) {}
