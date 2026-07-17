import { z } from 'zod';

export const AskBodySchema = z.object({
  question: z.string().min(1).max(1000),
  language: z.enum(['VI', 'EN']).default('VI'),
});
export type AskBodyType = z.infer<typeof AskBodySchema>;
