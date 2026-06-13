import z from 'zod';
import { ContentStatus } from '../generated/prisma/enums';

export const ContentStatusEnum = z.nativeEnum(ContentStatus);

// Localized text payload — vi required (primary), en optional.
export const LocalizedTextSchema = z.object({
  vi: z.string(),
  en: z.string().optional(),
});
export type LocalizedTextType = z.infer<typeof LocalizedTextSchema>;

export const UpsertPostBodySchema = z.object({
  title: LocalizedTextSchema,
  slug: z.string().min(1).max(300),
  body: LocalizedTextSchema.nullable().optional(),
  excerpt: LocalizedTextSchema.nullable().optional(),
  categoryId: z.string().min(1),
  status: ContentStatusEnum.optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
  coverMediaId: z.string().nullable().optional(),
  coverUrl: z.string().nullable().optional(),
  coverAlt: z.string().nullable().optional(),
  tagSlugs: z.array(z.string().min(1)).default([]),
  eventStartAt: z.string().nullable().optional(),
  eventEndAt: z.string().nullable().optional(),
  eventLocation: z.string().max(300).nullable().optional(),
});
export type UpsertPostBodyType = z.infer<typeof UpsertPostBodySchema>;

export const CloneIntoLayoutBodySchema = z.object({
  templateLayoutId: z.string().min(1),
  layoutName: z.string().min(1).max(300).optional(),
  layoutSlug: z.string().min(1).max(300).optional(),
});
export type CloneIntoLayoutBodyType = z.infer<typeof CloneIntoLayoutBodySchema>;

export const PostTagRefSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const PostLayoutRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  isPublished: z.boolean(),
  scheduledAt: z.date().nullable(),
  publishedAt: z.date().nullable(),
});

export const CategoryRefSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: LocalizedTextSchema,
});

export const PostResSchema = z.object({
  id: z.string(),
  title: LocalizedTextSchema,
  slug: z.string(),
  body: LocalizedTextSchema.nullable(),
  excerpt: LocalizedTextSchema.nullable(),
  categoryId: z.string(),
  category: CategoryRefSchema.optional(),
  status: ContentStatusEnum,
  coverMediaId: z.string().nullable(),
  coverUrl: z.string().nullable(),
  coverAlt: z.string().nullable(),
  tags: z.array(PostTagRefSchema),
  eventStartAt: z.date().nullable(),
  eventEndAt: z.date().nullable(),
  eventLocation: z.string().nullable(),
  publishedAt: z.date().nullable(),
  scheduledAt: z.date().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  layouts: z.array(PostLayoutRefSchema),
});
export type PostResType = z.infer<typeof PostResSchema>;

export const PostDraftResSchema = z.object({
  id: z.string(),
  slug: z.string(),
});
export type PostDraftResType = z.infer<typeof PostDraftResSchema>;

export const PostListResSchema = z.array(PostResSchema);
