import { z } from 'zod';

const LocalizedTextSchema = z.object({
  vi: z.string(),
  en: z.string().optional(),
});

export const CategoryResSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedTextSchema,
  excerpt: LocalizedTextSchema.nullable().optional(),
  image: z.string().nullable(),
  status: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type CategoryResType = z.infer<typeof CategoryResSchema>;

export const CategoryListResSchema = z.array(CategoryResSchema);

export const CreateCategoryBodySchema = z.object({
  slug: z.string().min(1).max(200),
  name: LocalizedTextSchema,
  excerpt: LocalizedTextSchema.optional(),
  image: z.string().optional().nullable(),
});
export type CreateCategoryBodyType = z.infer<typeof CreateCategoryBodySchema>;

export const UpdateCategoryBodySchema = CreateCategoryBodySchema.partial().extend({
  status: z.boolean().optional(),
});
export type UpdateCategoryBodyType = z.infer<typeof UpdateCategoryBodySchema>;
