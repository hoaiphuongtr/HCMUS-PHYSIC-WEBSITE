import z from 'zod';

export const CreatePageLayoutBodySchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().optional(),
});

export type CreatePageLayoutBodyType = z.infer<
  typeof CreatePageLayoutBodySchema
>;

export const UpdatePageLayoutBodySchema =
  CreatePageLayoutBodySchema.partial().extend({
    puckData: z.any().optional(),
  });

export const SavePuckDataBodySchema = z.object({
  puckData: z.any(),
});

export type SavePuckDataBodyType = z.infer<typeof SavePuckDataBodySchema>;

export const SchedulePublishBodySchema = z.object({
  scheduledAt: z.coerce.date(),
  alsoScheduleIds: z.array(z.string().min(1)).optional(),
});

export type SchedulePublishBodyType = z.infer<typeof SchedulePublishBodySchema>;

export type UpdatePageLayoutBodyType = z.infer<
  typeof UpdatePageLayoutBodySchema
>;

export const AddWidgetInstanceBodySchema = z.object({
  widgetId: z.string().min(1),
  config: z.any().optional(),
  order: z.number().int().min(0),
  row: z.number().int().min(0).optional(),
  colSpan: z.number().int().min(1).max(12).optional(),
});

export type AddWidgetInstanceBodyType = z.infer<
  typeof AddWidgetInstanceBodySchema
>;

export const UpdateWidgetInstanceBodySchema = z.object({
  config: z.any().optional(),
  order: z.number().int().min(0).optional(),
  row: z.number().int().min(0).optional(),
  colSpan: z.number().int().min(1).max(12).optional(),
  isVisible: z.boolean().optional(),
});

export type UpdateWidgetInstanceBodyType = z.infer<
  typeof UpdateWidgetInstanceBodySchema
>;

export const ReorderWidgetsBodySchema = z.object({
  orderedInstanceIds: z.array(z.string().min(1)),
});

export type ReorderWidgetsBodyType = z.infer<typeof ReorderWidgetsBodySchema>;

export const WidgetInstanceResSchema = z.object({
  id: z.string(),
  widgetId: z.string(),
  pageLayoutId: z.string(),
  config: z.any(),
  order: z.number(),
  row: z.number(),
  colSpan: z.number(),
  isVisible: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  widget: z
    .object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      icon: z.string().nullable(),
      configSchema: z.any(),
      defaultConfig: z.any(),
    })
    .optional(),
});

export type WidgetInstanceResType = z.infer<typeof WidgetInstanceResSchema>;

export const PageLayoutResSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  puckData: z.any().nullable(),
  isPublished: z.boolean(),
  publishedAt: z.date().nullable(),
  scheduledAt: z.date().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  widgets: z.array(WidgetInstanceResSchema).optional(),
});

export type PageLayoutResType = z.infer<typeof PageLayoutResSchema>;

export const DuplicatePageLayoutBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
});

export type DuplicatePageLayoutBodyType = z.infer<
  typeof DuplicatePageLayoutBodySchema
>;

export const MessageResSchema = z.object({
  message: z.string(),
});
