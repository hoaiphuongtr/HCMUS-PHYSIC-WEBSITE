import { createZodDto } from 'nestjs-zod';
import {
  AdminListQuerySchema,
  AdminListResSchema,
  AdminItemSchema,
  AdminMessageResSchema,
  ResetAdminPasswordBodySchema,
} from './admin.model';

export class AdminListQueryDTO extends createZodDto(AdminListQuerySchema) {}
export class AdminListResDTO extends createZodDto(AdminListResSchema) {}
export class AdminItemDTO extends createZodDto(AdminItemSchema) {}
export class AdminMessageResDTO extends createZodDto(AdminMessageResSchema) {}
export class ResetAdminPasswordBodyDTO extends createZodDto(
  ResetAdminPasswordBodySchema,
) {}
