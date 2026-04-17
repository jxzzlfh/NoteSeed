import type {
  PageSource,
  KnowledgeCard,
  CardAnalysis,
  PipelineTimings,
  CardFields,
} from '@noteseed/shared-types';
import { v4 as uuidv4 } from 'uuid';

import { run as runPageSense } from '../page-sense/index.js';
import { run as runContextualizer } from '../contextualizer/index.js';
import { run as runDistiller } from '../distiller/index.js';
import { run as runTagger } from '../tagger/index.js';
import { run as runCardwright } from '../cardwright/index.js';

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, ms: Math.round(performance.now() - start) };
}

export interface GenerateCardOptions {
  preferredTemplate?: string;
  retentionLevel?: 'minimal' | 'standard' | 'detailed';
  target?: string;
  userTagHistory?: string[];
}

export interface GenerateCardResult {
  card: KnowledgeCard;
  timings: PipelineTimings;
}

/**
 * Orchestrate the full Skills pipeline: PageSense → Contextualizer → Distiller → Tagger → Cardwright.
 * Includes degradation paths for each step.
 */
export async function generateCard(
  source: PageSource,
  options: GenerateCardOptions = {},
): Promise<GenerateCardResult> {
  const totalStart = performance.now();
  const timings: PipelineTimings = {
    pageSense_ms: 0,
    contextualizer_ms: 0,
    distiller_ms: 0,
    tagger_ms: 0,
    cardwright_ms: 0,
    total_ms: 0,
  };

  // Step 1: PageSense — classify page type
  let pageType = 'resource';
  let confidence = 0;
  let suggestedTemplate = 'generic-v1';

  try {
    const ps = await timed(() => runPageSense(source));
    timings.pageSense_ms = ps.ms;
    pageType = ps.result.pageType;
    confidence = ps.result.confidence;
    suggestedTemplate = ps.result.suggestedTemplate;
  } catch {
    // Degrade: use generic template
    timings.pageSense_ms = Math.round(performance.now() - totalStart);
  }

  // Step 2: Contextualizer — enrich metadata
  let author = source.metadata.author;
  let publishedAt = source.metadata.publishedAt;

  try {
    const ctx = await timed(() => runContextualizer(source));
    timings.contextualizer_ms = ctx.ms;
    author = ctx.result.author ?? author;
    publishedAt = ctx.result.publishedAt ?? publishedAt;
  } catch {
    timings.contextualizer_ms = 0;
  }

  // Step 3: Distiller — structured extraction
  let summary = '';
  let fields: CardFields = {};

  try {
    const dist = await timed(() =>
      runDistiller({
        cleanText: source.selectedText ?? source.cleanText,
        title: source.title,
        pageType,
      }),
    );
    timings.distiller_ms = dist.ms;
    summary = dist.result.summary;
    fields = dist.result as CardFields;
  } catch {
    summary = source.cleanText.slice(0, 200) + '…';
    timings.distiller_ms = 0;
  }

  // Step 4: Tagger — generate tags
  let tags: string[] = [];
  let category: string | undefined;

  try {
    const tag = await timed(() =>
      runTagger({
        summary,
        keyPoints: fields.keyPoints ?? [],
        userTagHistory: options.userTagHistory,
      }),
    );
    timings.tagger_ms = tag.ms;
    tags = tag.result.tags;
    category = tag.result.category;
  } catch {
    tags = [];
    timings.tagger_ms = 0;
  }

  // Step 5: Cardwright — render Markdown
  const analysis: CardAnalysis = {
    pageType: pageType as CardAnalysis['pageType'],
    confidence,
    summary,
    fields,
    tags,
    category,
    suggestedTemplate: options.preferredTemplate ?? suggestedTemplate,
  };

  let markdown = '';
  let plainText = '';

  try {
    const cw = await timed(() =>
      runCardwright({
        analysis,
        title: source.title,
        url: source.url,
        author,
        publishedAt,
        target: options.target,
      }),
    );
    timings.cardwright_ms = cw.ms;
    markdown = cw.result.markdown;
    plainText = cw.result.plainText;
  } catch {
    markdown = `# ${source.title}\n\n${summary}\n\n---\n来源: ${source.url}`;
    plainText = `${source.title}\n\n${summary}\n\n来源: ${source.url}`;
    timings.cardwright_ms = 0;
  }

  timings.total_ms = Math.round(performance.now() - totalStart);

  const now = new Date().toISOString();
  const card: KnowledgeCard = {
    id: uuidv4(),
    source,
    analysis,
    markdown,
    plainText,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  return { card, timings };
}
