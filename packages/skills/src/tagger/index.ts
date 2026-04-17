import type { TaggerOutput } from '@noteseed/shared-types';

import { callClaudeWithTool, MODELS } from '../llm/index.js';

import { buildUserPrompt, outputSchema, systemPrompt } from './prompt.js';

const TAGGER_TOOL = 'noteseed_tag';

export interface TaggerInput {
  summary: string;
  keyPoints: string[];
  userTagHistory?: string[];
}

function coerceTags(raw: Record<string, unknown>): string[] {
  const v = raw['tags'];
  if (!Array.isArray(v)) return [];
  const tags = v.filter((x): x is string => typeof x === 'string').slice(0, 5);
  if (tags.length >= 3) return tags;
  // Pad is invalid — return what we have; caller may validate upstream
  return tags;
}

export async function run(input: TaggerInput): Promise<TaggerOutput> {
  const raw = await callClaudeWithTool({
    model: MODELS.HAIKU,
    systemPrompt,
    userPrompt: buildUserPrompt(input),
    toolName: TAGGER_TOOL,
    toolDescription: 'Return tags, category, and topic for the knowledge card.',
    inputSchema: outputSchema,
    temperature: 0,
    maxTokens: 512,
  });

  const tags = coerceTags(raw);
  const cat = raw['category'];
  const topic = raw['topic'];
  return {
    tags,
    category: typeof cat === 'string' ? cat : '未分类',
    topic: typeof topic === 'string' ? topic : '',
  };
}
