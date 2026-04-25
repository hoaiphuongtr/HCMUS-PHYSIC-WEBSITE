import z from 'zod';
import { PostCategory } from '../generated/prisma/enums';
import { ContentStatus } from '../generated/prisma/enums';

export const PostCategoryEnum = z.nativeEnum(PostCategory);
export const ContentStatusEnum = z.nativeEnum(ContentStatus);

export const UpsertPostBodySchema = z.object({
  title: z.string().min(1).max(300),
  slug: z.string().min(1).max(300),
  body: z.string().max(200_000).optional().nullable(),
  excerpt: z.string().max(1000).optional().nullable(),
  category: PostCategoryEnum,
  status: ContentStatusEnum.optional(),
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

export const PostResSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  body: z.string().nullable(),
  excerpt: z.string().nullable(),
  category: PostCategoryEnum,
  status: ContentStatusEnum,
  coverMediaId: z.string().nullable(),
  coverUrl: z.string().nullable(),
  coverAlt: z.string().nullable(),
  tags: z.array(PostTagRefSchema),
  eventStartAt: z.date().nullable(),
  eventEndAt: z.date().nullable(),
  eventLocation: z.string().nullable(),
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
