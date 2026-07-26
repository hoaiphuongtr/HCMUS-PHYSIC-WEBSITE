import { z } from 'zod';

export const NotificationResSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  link: z.string().nullable(),
  isRead: z.boolean(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
});
export type NotificationResType = z.infer<typeof NotificationResSchema>;

export const NotificationListResSchema = z.object({
  items: z.array(NotificationResSchema),
  unread: z.number(),
});

export const UnreadCountResSchema = z.object({ unread: z.number() });
