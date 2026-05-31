import { createZodDto } from 'nestjs-zod';
import {
  AdminListQuerySchema,
  AdminListResSchema,
  AdminItemSchema,
} from './admin.model';

export class AdminListQueryDTO extends createZodDto(AdminListQuerySchema) {}
export class AdminListResDTO extends createZodDto(AdminListResSchema) {}
export class AdminItemDTO extends createZodDto(AdminItemSchema) {}
