import type { PageSenseOutput, PageSource } from '@noteseed/shared-types';

import { callClaudeStructured } from '../llm/structured.js';
import { getFastModel } from '../llm/models.js';
import { PAGE_SENSE_SYSTEM_PROMPT, pageSenseStructuredSchema } from './prompt.js';
import { detectByDomain, detectByDOM, detectByKeywords } from './signals.js';

const TEXT_PREVIEW_LEN = 2000;

function formatSignalsForPrompt(
  signals: ReturnType<typeof detectByDomain>,
): string {
  if (signals.length === 0) {
    return '(no heuristic signals)';
  }
  return signals
    .map(
      (s) =>
        `- [${s.source}] ${s.pageType} (weight ${s.weight.toFixed(2)})`,
    )
    .join('\n');
}

function buildUserPrompt(input: PageSource): string {
  const domainSignals = detectByDomain(input.url);
  const domSignals = detectByDOM(input.rawHTML);
  const keywordSignals = detectByKeywords(`${input.title}\n${input.cleanText}`);
  const merged = [...domainSignals, ...domSignals, ...keywordSignals];

  const excerpt = input.cleanText.slice(0, TEXT_PREVIEW_LEN);

  return [
    `URL: ${input.url}`,
    '',
    `Title: ${input.title}`,
    '',
    'Heuristic signals:',
    formatSignalsForPrompt(merged),
    '',
    `Plain-text excerpt (first ${TEXT_PREVIEW_LEN} chars):`,
    excerpt,
  ].join('\n');
}

/**
 * Classifies the page using heuristics + Claude Haiku (structured tool output).
 */
export async function run(input: PageSource): Promise<PageSenseOutput> {
  const userPrompt = buildUserPrompt(input);

  const parsed = await callClaudeStructured(
    {
      model: getFastModel(),
      systemPrompt: PAGE_SENSE_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.2,
      maxTokens: 1024,
    },
    pageSenseStructuredSchema,
    {
      toolName: 'emit_page_sense',
      toolDescription: 'Emit the final PageSense classification as JSON.',
    },
  );

  return {
    pageType: parsed.pageType as PageSenseOutput['pageType'],
    confidence: parsed.confidence,
    suggestedTemplate: parsed.suggestedTemplate,
    signals: parsed.signals,
  };
}

export { detectByDomain, detectByDOM, detectByKeywords } from './signals.js';
export type { Signal, SignalSource } from './signals.js';
export { PAGE_SENSE_SYSTEM_PROMPT, pageSenseStructuredSchema } from './prompt.js';
