import { z } from 'zod';

export const RenderModeSchema = z.enum(['iframe', 'embed']);

export const StaticPageResSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  html: z.string(),
  renderMode: z.string(),
  bundlePath: z.string().nullable(),
  isPublished: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type StaticPageResType = z.infer<typeof StaticPageResSchema>;

// The list view doesn't need the (potentially large) html blob.
export const StaticPageListItemSchema = StaticPageResSchema.omit({
  html: true,
});
export const StaticPageListResSchema = z.array(StaticPageListItemSchema);

export const CreateStaticPageBodySchema = z.object({
  slug: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(300),
  // Optional: a page can instead be a folder microsite uploaded as a .zip
  // (bundlePath). Defaults to empty so a bundle-only page can be created first.
  html: z.string().default(''),
  renderMode: RenderModeSchema.default('iframe'),
  isPublished: z.boolean().default(false),
});
export type CreateStaticPageBodyType = z.infer<
  typeof CreateStaticPageBodySchema
>;

export const UpdateStaticPageBodySchema = CreateStaticPageBodySchema.partial();
export type UpdateStaticPageBodyType = z.infer<
  typeof UpdateStaticPageBodySchema
>;
