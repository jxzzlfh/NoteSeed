import { z } from 'zod';

export const PageSourceMetadataSchema = z.object({
  siteName: z.string(),
  author: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  language: z.string().optional(),
});

export const PageSourceSchema = z.object({
  sourceId: z.string().uuid(),
  url: z.string().url(),
  title: z.string().min(1),
  rawHTML: z.string().optional(),
  cleanText: z.string().min(1),
  selectedText: z.string().optional(),
  metadata: PageSourceMetadataSchema,
  collectedAt: z.string().datetime(),
});

export type PageSourceSchemaType = z.infer<typeof PageSourceSchema>;
