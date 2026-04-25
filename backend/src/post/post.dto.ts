import { createZodDto } from 'nestjs-zod';
import {
  CloneIntoLayoutBodySchema,
  PostDraftResSchema,
  PostResSchema,
  UpsertPostBodySchema,
} from './post.model';

export class UpsertPostBodyDTO extends createZodDto(UpsertPostBodySchema) {}
export class CloneIntoLayoutBodyDTO extends createZodDto(
  CloneIntoLayoutBodySchema,
) {}
export class PostResDTO extends createZodDto(PostResSchema) {}
export class PostDraftResDTO extends createZodDto(PostDraftResSchema) {}
