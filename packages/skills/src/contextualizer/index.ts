import { z } from 'zod';

import type { ContextualizerOutput, PageSource } from '@noteseed/shared-types';

import { callClaudeStructured } from '../llm/structured.js';
import { MODELS } from '../llm/models.js';
import { detectLanguageLabel, estimateReadingTime } from './reading-time.js';

const CONTEXTUALIZER_SYSTEM_PROMPT = `You infer publication metadata from a short plain-text excerpt of a web page.

Rules:
- Only fill fields you can justify from the excerpt (byline, "Published", ISO dates, "Updated", series titles, outlet credibility cues).
- If unknown, omit optional fields rather than guessing wildly.
- language must be a short BCP-47–style code (e.g. en, zh, ja) inferred from wording and script.
- publishedAt must be ISO 8601 if you include it (date or full datetime).
- sourceCredibility: high for primary docs and major outlets; medium for blogs with reputation; low for anonymous or sketchy pages.
- relatedSeriesTitle only when the excerpt clearly indicates a named series or column.

Respond only via the provided tool — no extra prose.`;

const contextualizerInferenceSchema = z.object({
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  language: z.string().min(2).max(16),
  sourceCredibility: z.enum(['high', 'medium', 'low']).optional(),
  relatedSeriesTitle: z.string().optional(),
});

const EXCERPT_LEN = 1500;

function isNonEmpty(s: string | undefined): boolean {
  return s !== undefined && s.trim() !== '';
}

function buildReadingText(input: PageSource): string {
  return [input.title, input.cleanText].filter(Boolean).join('\n\n');
}

/**
 * Enriches metadata and always computes reading time; uses Haiku only when author or date is missing.
 */
export async function run(input: PageSource): Promise<ContextualizerOutput> {
  const readingText = buildReadingText(input);
  const readingTime = estimateReadingTime(readingText);

  const meta = input.metadata;
  const hasAuthor = isNonEmpty(meta.author);
  const hasPublishedAt = isNonEmpty(meta.publishedAt);

  if (hasAuthor && hasPublishedAt) {
    return {
      author: meta.author,
      publishedAt: meta.publishedAt,
      language: meta.language ?? detectLanguageLabel(readingText),
      readingTime,
      sourceCredibility: undefined,
      relatedSeriesTitle: undefined,
    };
  }

  const excerpt = input.cleanText.slice(0, EXCERPT_LEN);
  const userPrompt = [
    `URL: ${input.url}`,
    `Site name (Open Graph / meta): ${meta.siteName}`,
    meta.author ? `Known author from capture: ${meta.author}` : 'Known author from capture: (none)',
    meta.publishedAt
      ? `Known published date from capture: ${meta.publishedAt}`
      : 'Known published date from capture: (none)',
    meta.language ? `Known language hint: ${meta.language}` : '',
    '',
    'Excerpt:',
    excerpt,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const inferred = await callClaudeStructured(
    {
      model: MODELS.HAIKU,
      systemPrompt: CONTEXTUALIZER_SYSTEM_PROMPT,
      userPrompt,
      temperature: 0.1,
      maxTokens: 512,
    },
    contextualizerInferenceSchema,
    {
      toolName: 'emit_contextualizer',
      toolDescription: 'Emit inferred metadata fields as JSON.',
    },
  );

  return {
    author: hasAuthor ? meta.author : inferred.author,
    publishedAt: hasPublishedAt ? meta.publishedAt : inferred.publishedAt,
    language: meta.language ?? inferred.language,
    readingTime,
    sourceCredibility: inferred.sourceCredibility,
    relatedSeriesTitle: inferred.relatedSeriesTitle,
  };
}

export { estimateReadingTime, detectLanguageLabel } from './reading-time.js';
