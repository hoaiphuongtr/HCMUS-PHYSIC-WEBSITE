import z from 'zod';

export const CreateDepartmentBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type CreateDepartmentBodyType = z.infer<
  typeof CreateDepartmentBodySchema
>;

export const DepartmentResSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DepartmentResType = z.infer<typeof DepartmentResSchema>;
