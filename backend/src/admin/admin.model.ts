import { z } from 'zod';

export const AdminListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type AdminListQueryType = z.infer<typeof AdminListQuerySchema>;

export const AdminItemSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  position: z.string().nullable(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN']),
  isActive: z.boolean(),
  lastLoginAt: z.date().nullable(),
  createdAt: z.date(),
  department: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .nullable(),
});

export type AdminItemType = z.infer<typeof AdminItemSchema>;

export const AdminListResSchema = z.object({
  items: z.array(AdminItemSchema),
  total: z.number().int(),
  activeNow: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type AdminListResType = z.infer<typeof AdminListResSchema>;
