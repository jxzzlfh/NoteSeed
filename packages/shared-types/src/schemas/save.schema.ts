import { z } from 'zod';
import { KnowledgeCardSchema } from './knowledge-card.schema.js';

export const SaveTargetSchema = z.enum(['memos', 'feishu', 'get', 'ksdoc']);

export const MemosOptionsSchema = z.object({
  visibility: z.enum(['private', 'public']),
  renderMode: z.enum(['compact', 'full']),
});

export const FeishuOptionsSchema = z.object({
  folderToken: z.string().optional(),
});

export const SaveOptionsSchema = z.object({
  memos: MemosOptionsSchema.optional(),
  feishu: FeishuOptionsSchema.optional(),
});

export const SaveRequestSchema = z.object({
  requestId: z.string().uuid(),
  card: KnowledgeCardSchema,
  targets: z.array(SaveTargetSchema).min(1),
  options: SaveOptionsSchema.optional(),
});

export const SaveTargetResultSchema = z.object({
  target: SaveTargetSchema,
  success: z.boolean(),
  targetRef: z.string().optional(),
  targetUrl: z.string().url().optional(),
  error: z.string().optional(),
  savedAt: z.string().datetime(),
});

export const SaveResultSchema = z.object({
  requestId: z.string().uuid(),
  results: z.array(SaveTargetResultSchema),
});

export type SaveRequestSchemaType = z.infer<typeof SaveRequestSchema>;
export type SaveResultSchemaType = z.infer<typeof SaveResultSchema>;
