import { createZodDto } from 'nestjs-zod';
import {
  CategoryResSchema,
  CategoryListResSchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
} from './category.model';

export class CategoryResDTO extends createZodDto(CategoryResSchema) {}
export class CategoryListResDTO extends createZodDto(CategoryListResSchema) {}
export class CreateCategoryBodyDTO extends createZodDto(
  CreateCategoryBodySchema,
) {}
export class UpdateCategoryBodyDTO extends createZodDto(
  UpdateCategoryBodySchema,
) {}
