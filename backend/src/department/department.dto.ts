import { createZodDto } from 'nestjs-zod';
import {
  CreateDepartmentBodySchema,
  DepartmentResSchema,
} from './department.model';

export class CreateDepartmentBodyDTO extends createZodDto(
  CreateDepartmentBodySchema,
) {}
export class DepartmentResDTO extends createZodDto(DepartmentResSchema) {}
