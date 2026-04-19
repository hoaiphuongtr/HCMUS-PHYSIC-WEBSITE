import { createZodDto } from 'nestjs-zod';
import {
  CreateFromUrlBodySchema,
  ListMediaQuerySchema,
  MediaListResSchema,
  MediaResSchema,
  UpdateMediaBodySchema,
  UploadMediaBodySchema,
} from './media.model';

export class UploadMediaBodyDTO extends createZodDto(UploadMediaBodySchema) {}
export class UpdateMediaBodyDTO extends createZodDto(UpdateMediaBodySchema) {}
export class CreateFromUrlBodyDTO extends createZodDto(
  CreateFromUrlBodySchema,
) {}
export class ListMediaQueryDTO extends createZodDto(ListMediaQuerySchema) {}
export class MediaResDTO extends createZodDto(MediaResSchema) {}
export class MediaListResDTO extends createZodDto(MediaListResSchema) {}
