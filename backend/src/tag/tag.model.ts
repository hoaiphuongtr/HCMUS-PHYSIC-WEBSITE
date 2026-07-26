import { z } from 'zod';

export const TagResSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  // icon holds either a Material Symbol name (text tag) or an image URL
  // (/uploads/... or http…) for an image tag; null = plain text tag.
  icon: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  postCount: z.number().optional(),
});
export type TagResType = z.infer<typeof TagResSchema>;

export const TagListResSchema = z.array(TagResSchema);

export const CreateTagBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200).optional(),
  icon: z.string().max(500).optional().nullable(),
});
export type CreateTagBodyType = z.infer<typeof CreateTagBodySchema>;

export const UpdateTagBodySchema = CreateTagBodySchema.partial();
export type UpdateTagBodyType = z.infer<typeof UpdateTagBodySchema>;

export const MergeTagBodySchema = z.object({
  targetId: z.string().min(1),
});
export type MergeTagBodyType = z.infer<typeof MergeTagBodySchema>;
