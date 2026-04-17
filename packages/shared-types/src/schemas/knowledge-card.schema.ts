import { z } from 'zod';
import { PageSourceSchema } from './page-source.schema.js';
import { CardAnalysisSchema } from './card-analysis.schema.js';

export const CardStatusSchema = z.enum(['draft', 'saved', 'failed']);

export const KnowledgeCardSchema = z.object({
  id: z.string().uuid(),
  source: PageSourceSchema,
  analysis: CardAnalysisSchema,
  markdown: z.string().min(1),
  plainText: z.string().min(1),
  status: CardStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type KnowledgeCardSchemaType = z.infer<typeof KnowledgeCardSchema>;
