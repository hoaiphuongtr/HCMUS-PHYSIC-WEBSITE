import z from 'zod';

export const CreateSubscriptionBodySchema = z.object({
  email: z.email(),
  tagSlugs: z.array(z.string()).default([]),
  visitorId: z.string().optional(),
});
export type CreateSubscriptionBodyType = z.infer<
  typeof CreateSubscriptionBodySchema
>;

export const SubscriptionResSchema = z.object({
  id: z.string(),
  email: z.string(),
  visitorId: z.string().nullable(),
  tagSlugs: z.array(z.string()),
  verifiedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type SubscriptionResType = z.infer<typeof SubscriptionResSchema>;

export const SubscriptionByEmailResSchema = z.object({
  tagSlugs: z.array(z.string()),
});
export type SubscriptionByEmailResType = z.infer<
  typeof SubscriptionByEmailResSchema
>;
