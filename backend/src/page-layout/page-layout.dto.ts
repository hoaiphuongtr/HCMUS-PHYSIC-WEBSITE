import { createZodDto } from 'nestjs-zod';
import {
  CreatePageLayoutBodySchema,
  UpdatePageLayoutBodySchema,
  AddWidgetInstanceBodySchema,
  UpdateWidgetInstanceBodySchema,
  ReorderWidgetsBodySchema,
  DuplicatePageLayoutBodySchema,
  PageLayoutResSchema,
  WidgetInstanceResSchema,
  MessageResSchema,
} from './page-layout.model';

export class CreatePageLayoutBodyDTO extends createZodDto(
  CreatePageLayoutBodySchema,
) {}
export class UpdatePageLayoutBodyDTO extends createZodDto(
  UpdatePageLayoutBodySchema,
) {}
export class AddWidgetInstanceBodyDTO extends createZodDto(
  AddWidgetInstanceBodySchema,
) {}
export class UpdateWidgetInstanceBodyDTO extends createZodDto(
  UpdateWidgetInstanceBodySchema,
) {}
export class ReorderWidgetsBodyDTO extends createZodDto(
  ReorderWidgetsBodySchema,
) {}
export class PageLayoutResDTO extends createZodDto(PageLayoutResSchema) {}
export class WidgetInstanceResDTO extends createZodDto(
  WidgetInstanceResSchema,
) {}
export class DuplicatePageLayoutBodyDTO extends createZodDto(
  DuplicatePageLayoutBodySchema,
) {}
export class PageLayoutMessageResDTO extends createZodDto(MessageResSchema) {}
