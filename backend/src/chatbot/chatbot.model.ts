import { z } from 'zod';

export const AskBodySchema = z.object({
  question: z.string().min(1).max(1000),
  language: z.enum(['VI', 'EN']).default('VI'),
});
export type AskBodyType = z.infer<typeof AskBodySchema>;

// Curated Q&A ("training") the faculty wants answered verbatim — dean, contact,
// admissions, etc. Stored in ChatbotTraining and indexed incrementally so a few
// authoritative answers can be added without a full 31k-chunk reindex.
export const TrainItemSchema = z.object({
  question: z.string().min(1).max(2000),
  answer: z.string().min(1).max(8000),
  language: z.enum(['VI', 'EN']).default('VI'),
  context: z.string().max(8000).optional(),
});
export const TrainBodySchema = z.object({
  items: z.array(TrainItemSchema).min(1).max(100),
});
export type TrainBodyType = z.infer<typeof TrainBodySchema>;
