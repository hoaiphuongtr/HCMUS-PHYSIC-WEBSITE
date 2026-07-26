import { createZodDto } from 'nestjs-zod';
import {
  CreateDepartmentBodySchema,
  DepartmentResSchema,
  UpdateDepartmentBodySchema,
  MergeDepartmentBodySchema,
} from './department.model';

export class CreateDepartmentBodyDTO extends createZodDto(
  CreateDepartmentBodySchema,
) {}
export class UpdateDepartmentBodyDTO extends createZodDto(
  UpdateDepartmentBodySchema,
) {}
export class DepartmentResDTO extends createZodDto(DepartmentResSchema) {}
export class MergeDepartmentBodyDTO extends createZodDto(
  MergeDepartmentBodySchema,
) {}
