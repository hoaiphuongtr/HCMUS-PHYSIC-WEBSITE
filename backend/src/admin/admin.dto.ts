import { createZodDto } from 'nestjs-zod';
import {
  AdminListQuerySchema,
  AdminListResSchema,
  AdminItemSchema,
  AdminMessageResSchema,
  CreateStaffBodySchema,
  ResetAdminPasswordBodySchema,
  UpdateAdminProfileBodySchema,
} from './admin.model';

export class AdminListQueryDTO extends createZodDto(AdminListQuerySchema) {}
export class AdminListResDTO extends createZodDto(AdminListResSchema) {}
export class AdminItemDTO extends createZodDto(AdminItemSchema) {}
export class AdminMessageResDTO extends createZodDto(AdminMessageResSchema) {}
export class CreateStaffBodyDTO extends createZodDto(CreateStaffBodySchema) {}
export class ResetAdminPasswordBodyDTO extends createZodDto(
  ResetAdminPasswordBodySchema,
) {}
export class UpdateAdminProfileBodyDTO extends createZodDto(
  UpdateAdminProfileBodySchema,
) {}
