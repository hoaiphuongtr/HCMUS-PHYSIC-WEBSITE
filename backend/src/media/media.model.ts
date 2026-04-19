import z from 'zod';

export const UploadMediaBodySchema = z.object({
  alt: z.string().optional(),
  tagSlugs: z
    .union([z.array(z.string()), z.string()])
    .transform((v) => {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    })
    .optional(),
});
export type UploadMediaBodyType = z.infer<typeof UploadMediaBodySchema>;

export const UpdateMediaBodySchema = z.object({
  name: z.string().optional(),
  alt: z.string().nullable().optional(),
  tagSlugs: z.array(z.string()).optional(),
});
export type UpdateMediaBodyType = z.infer<typeof UpdateMediaBodySchema>;

export const CreateFromUrlBodySchema = z.object({
  url: z.url(),
  name: z.string().optional(),
  alt: z.string().optional(),
  tagSlugs: z.array(z.string()).default([]),
});
export type CreateFromUrlBodyType = z.infer<typeof CreateFromUrlBodySchema>;

export const ListMediaQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(24),
  search: z.string().optional(),
  tagSlug: z.string().optional(),
  type: z.string().optional(),
});
export type ListMediaQueryType = z.infer<typeof ListMediaQuerySchema>;

export const MediaResSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  url: z.string(),
  mimeType: z.string().nullable(),
  size: z.number().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  alt: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(
    z.object({ id: z.string(), slug: z.string(), name: z.string() }),
  ),
});
export type MediaResType = z.infer<typeof MediaResSchema>;

export const MediaListResSchema = z.object({
  items: z.array(MediaResSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type MediaListResType = z.infer<typeof MediaListResSchema>;
