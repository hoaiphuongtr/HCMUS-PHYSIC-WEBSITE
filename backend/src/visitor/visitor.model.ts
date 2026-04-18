import z from 'zod';

export const TrackSlugBodySchema = z.object({
  visitorId: z.string().min(1),
  slug: z.string().min(1),
});
export type TrackSlugBodyType = z.infer<typeof TrackSlugBodySchema>;

export const TrackPostBodySchema = z.object({
  visitorId: z.string().min(1),
  postId: z.string().min(1),
});
export type TrackPostBodyType = z.infer<typeof TrackPostBodySchema>;

export const VisitorProfileResSchema = z.object({
  tagWeights: z.record(z.string(), z.number()),
  slugWeights: z.record(z.string(), z.number()),
  subscribedTagSlugs: z.array(z.string()),
});
export type VisitorProfileResType = z.infer<typeof VisitorProfileResSchema>;

export const VisitorSuggestionsResSchema = z.object({
  suggestedLinks: z.array(
    z.object({
      label: z.string(),
      url: z.string(),
    }),
  ),
  hotTags: z.array(
    z.object({
      slug: z.string(),
      label: z.string(),
    }),
  ),
});
export type VisitorSuggestionsResType = z.infer<
  typeof VisitorSuggestionsResSchema
>;
