/**
 * Model IDs for NoteSeed skills (see docs/03-开发任务书.md Task 3.1).
 */
export const MODELS = {
  HAIKU: 'claude-haiku-4-5-20251001',
  SONNET: 'claude-sonnet-4-6',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];
