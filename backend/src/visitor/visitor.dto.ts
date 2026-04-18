import { createZodDto } from 'nestjs-zod';
import {
  TrackPostBodySchema,
  TrackSlugBodySchema,
  VisitorProfileResSchema,
  VisitorSuggestionsResSchema,
} from './visitor.model';

export class TrackSlugBodyDTO extends createZodDto(TrackSlugBodySchema) {}
export class TrackPostBodyDTO extends createZodDto(TrackPostBodySchema) {}
export class VisitorProfileResDTO extends createZodDto(
  VisitorProfileResSchema,
) {}
export class VisitorSuggestionsResDTO extends createZodDto(
  VisitorSuggestionsResSchema,
) {}
