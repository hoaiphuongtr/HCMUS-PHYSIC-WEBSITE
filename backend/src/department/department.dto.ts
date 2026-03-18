import { createZodDto } from 'nestjs-zod';
import {
  CreateDepartmentBodySchema,
  DepartmentResSchema,
  UpdateDepartmentBodySchema,
} from './department.model';

export class CreateDepartmentBodyDTO extends createZodDto(
  CreateDepartmentBodySchema,
) {}
export class UpdateDepartmentBodyDTO extends createZodDto(
  UpdateDepartmentBodySchema,
) {}
export class DepartmentResDTO extends createZodDto(DepartmentResSchema) {}
