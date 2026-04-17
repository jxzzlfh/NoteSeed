import { callClaudeWithTool, getPowerfulModel } from '../llm/index.js';

import * as docPrompt from './prompts/doc.js';
import * as genericPrompt from './prompts/generic.js';
import * as newsPrompt from './prompts/news.js';
import * as opinionPrompt from './prompts/opinion.js';
import * as tutorialPrompt from './prompts/tutorial.js';

const DISTILLER_TOOL = 'noteseed_distill';

export interface DistillerInput {
  cleanText: string;
  title: string;
  pageType: string;
}

/** Structured extraction; fields depend on page type (see PRD CardFields). */
export interface DistillerOutput {
  summary: string;
  prerequisites?: string[];
  steps?: string[];
  warnings?: string[];
  keyPoints?: string[];
  quotes?: string[];
  counterArguments?: string[];
  whoWhatWhenWhere?: string;
  keyFacts?: string[];
  apiSignature?: string;
  params?: Array<{ name: string; type: string; desc: string }>;
  examples?: string[];
}

type PromptModule = {
  systemPrompt: string;
  buildUserPrompt: (input: DistillerInput) => string;
  outputSchema: Record<string, unknown>;
};

const PROMPT_MAP: Record<string, PromptModule> = {
  tutorial: tutorialPrompt,
  opinion: opinionPrompt,
  news: newsPrompt,
  doc: docPrompt,
};

function coerceSummary(raw: Record<string, unknown>): string {
  const s = raw['summary'];
  return typeof s === 'string' ? s : '';
}

function coerceStringArray(raw: Record<string, unknown>, key: string): string[] | undefined {
  const v = raw[key];
  if (!Array.isArray(v)) return undefined;
  const out = v.filter((x): x is string => typeof x === 'string');
  return out.length ? out : undefined;
}

function coerceParams(raw: Record<string, unknown>): DistillerOutput['params'] {
  const v = raw['params'];
  if (!Array.isArray(v)) return undefined;
  const out: NonNullable<DistillerOutput['params']> = [];
  for (const item of v) {
    if (typeof item !== 'object' || item === null) continue;
    const o = item as Record<string, unknown>;
    const name = o['name'];
    const type = o['type'];
    const desc = o['desc'];
    if (typeof name === 'string' && typeof type === 'string' && typeof desc === 'string') {
      out.push({ name, type, desc });
    }
  }
  return out.length ? out : undefined;
}

function toTutorial(raw: Record<string, unknown>): DistillerOutput {
  return {
    summary: coerceSummary(raw),
    prerequisites: coerceStringArray(raw, 'prerequisites'),
    steps: coerceStringArray(raw, 'steps'),
    warnings: coerceStringArray(raw, 'warnings'),
  };
}

function toOpinion(raw: Record<string, unknown>): DistillerOutput {
  return {
    summary: coerceSummary(raw),
    keyPoints: coerceStringArray(raw, 'keyPoints'),
    quotes: coerceStringArray(raw, 'quotes'),
    counterArguments: coerceStringArray(raw, 'counterArguments'),
  };
}

function toNews(raw: Record<string, unknown>): DistillerOutput {
  const www = raw['whoWhatWhenWhere'];
  return {
    summary: coerceSummary(raw),
    whoWhatWhenWhere: typeof www === 'string' ? www : undefined,
    keyFacts: coerceStringArray(raw, 'keyFacts'),
  };
}

function toDoc(raw: Record<string, unknown>): DistillerOutput {
  const sig = raw['apiSignature'];
  return {
    summary: coerceSummary(raw),
    apiSignature: typeof sig === 'string' ? sig : undefined,
    params: coerceParams(raw),
    examples: coerceStringArray(raw, 'examples'),
  };
}

function toGeneric(raw: Record<string, unknown>): DistillerOutput {
  return {
    summary: coerceSummary(raw),
    keyPoints: coerceStringArray(raw, 'keyPoints'),
  };
}

export async function run(input: DistillerInput): Promise<DistillerOutput> {
  const mod = PROMPT_MAP[input.pageType] ?? genericPrompt;
  const kind = PROMPT_MAP[input.pageType] ? input.pageType : 'generic';

  const raw = await callClaudeWithTool({
    model: getPowerfulModel(),
    systemPrompt: mod.systemPrompt,
    userPrompt: mod.buildUserPrompt(input),
    toolName: DISTILLER_TOOL,
    toolDescription: 'Return structured distillation fields for the page.',
    inputSchema: mod.outputSchema,
    temperature: 0.3,
    maxTokens: 2000,
  });

  switch (kind) {
    case 'tutorial':
      return toTutorial(raw);
    case 'opinion':
      return toOpinion(raw);
    case 'news':
      return toNews(raw);
    case 'doc':
      return toDoc(raw);
    default:
      return toGeneric(raw);
  }
}
