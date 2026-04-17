import { z } from 'zod';

export const PageTypeSchema = z.enum([
  'tutorial',
  'opinion',
  'news',
  'doc',
  'tool',
  'resource',
  'longform',
  'discussion',
]);

const ParamSchema = z.object({
  name: z.string(),
  type: z.string(),
  desc: z.string(),
});

export const CardFieldsSchema = z.object({
  // Tutorial
  prerequisites: z.array(z.string()).optional(),
  steps: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  // Opinion
  keyPoints: z.array(z.string()).optional(),
  quotes: z.array(z.string()).optional(),
  counterArguments: z.array(z.string()).optional(),
  // News
  whoWhatWhenWhere: z.string().optional(),
  keyFacts: z.array(z.string()).optional(),
  // Doc
  apiSignature: z.string().optional(),
  params: z.array(ParamSchema).optional(),
  examples: z.array(z.string()).optional(),
  // Tool
  useCase: z.string().optional(),
  pros: z.array(z.string()).optional(),
  cons: z.array(z.string()).optional(),
  pricing: z.string().optional(),
  // Resource
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  bestFor: z.string().optional(),
  // Longform
  outline: z.array(z.string()).optional(),
  keyInsights: z.array(z.string()).optional(),
  // Discussion
  question: z.string().optional(),
  topAnswers: z.array(z.string()).optional(),
  consensus: z.string().optional(),
  controversy: z.string().optional(),
  // Generic
  actionItems: z.array(z.string()).optional(),
  facts: z.array(z.string()).optional(),
});

export const CardAnalysisSchema = z.object({
  pageType: PageTypeSchema,
  confidence: z.number().min(0).max(1),
  summary: z.string().min(1),
  fields: CardFieldsSchema,
  tags: z.array(z.string()).min(1).max(10),
  category: z.string().optional(),
  suggestedTemplate: z.string(),
  noveltyScore: z.number().min(0).max(1).optional(),
});

export type CardAnalysisSchemaType = z.infer<typeof CardAnalysisSchema>;
