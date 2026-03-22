import z from 'zod';

const WidgetCategoryEnum = [
  'FEED_COMPONENTS',
  'UTILITY_INFO',
  'CONTENT',
  'NAVIGATION',
] as const;

export const CreateWidgetBodySchema = z.object({
  type: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(WidgetCategoryEnum),
  icon: z.string().optional(),
  configSchema: z.any(),
  defaultConfig: z.any().optional(),
});

export type CreateWidgetBodyType = z.infer<typeof CreateWidgetBodySchema>;

export const UpdateWidgetBodySchema = CreateWidgetBodySchema.partial();

export type UpdateWidgetBodyType = z.infer<typeof UpdateWidgetBodySchema>;

export const WidgetResSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  icon: z.string().nullable(),
  configSchema: z.any(),
  defaultConfig: z.any(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WidgetResType = z.infer<typeof WidgetResSchema>;
