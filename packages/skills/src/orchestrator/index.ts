import type {
  PageSource,
  KnowledgeCard,
  CardAnalysis,
  PipelineTimings,
  CardFields,
  AIProviderConfig,
} from '@noteseed/shared-types';
import { v4 as uuidv4 } from 'uuid';

import { run as runPageSense } from '../page-sense/index.js';
import { run as runContextualizer } from '../contextualizer/index.js';
import { run as runDistiller } from '../distiller/index.js';
import { run as runTagger } from '../tagger/index.js';
import { run as runCardwright } from '../cardwright/index.js';
import { setActiveProvider, clearActiveProvider } from '../llm/provider.js';
import { setActiveModels, clearActiveModels } from '../llm/models.js';
import { createProvider } from '../llm/factory.js';

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = performance.now();
  const result = await fn();
  return { result, ms: Math.round(performance.now() - start) };
}

export interface GenerateCardOptions {
  preferredTemplate?: string;
  customPrompt?: string;
  retentionLevel?: 'minimal' | 'standard' | 'detailed';
  target?: string;
  userTagHistory?: string[];
  /** Custom AI provider config — overrides env-based defaults */
  aiProvider?: AIProviderConfig;
}

export interface GenerateCardResult {
  card: KnowledgeCard;
  timings: PipelineTimings;
}

/**
 * Orchestrate the full Skills pipeline: PageSense → Contextualizer → Distiller → Tagger → Cardwright.
 * Includes degradation paths for each step.
 *
 * When `options.aiProvider` is supplied, all LLM calls in this pipeline invocation
 * use that provider/model config instead of environment defaults.
 */
export async function generateCard(
  source: PageSource,
  options: GenerateCardOptions = {},
): Promise<GenerateCardResult> {
  if (options.aiProvider) {
    setActiveProvider(createProvider(options.aiProvider));
    setActiveModels(options.aiProvider.models);
  }

  try {
    return await runPipeline(source, options);
  } finally {
    if (options.aiProvider) {
      clearActiveProvider();
      clearActiveModels();
    }
  }
}

async function runPipeline(
  source: PageSource,
  options: GenerateCardOptions,
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
    timings.pageSense_ms = Math.round(performance.now() - totalStart);
  }

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

  const TEMPLATE_TO_PAGETYPE: Record<string, string> = {
    tutorial: 'tutorial',
    opinion: 'opinion',
    detailed: 'opinion',
  };
  const TEMPLATE_TO_RETENTION: Record<string, 'minimal' | 'standard' | 'detailed'> = {
    concise: 'minimal',
    detailed: 'detailed',
  };

  const tplOverride = options.preferredTemplate
    ? TEMPLATE_TO_PAGETYPE[options.preferredTemplate]
    : undefined;
  const effectivePageType = tplOverride ?? pageType;

  // 'custom' uses a dedicated distiller prompt but keeps the real pageType for validation
  const distillerPageType =
    options.preferredTemplate === 'custom' ? 'custom' : effectivePageType;

  const retentionLevel =
    options.retentionLevel ??
    (options.preferredTemplate
      ? TEMPLATE_TO_RETENTION[options.preferredTemplate]
      : undefined);

  let summary = '';
  let fields: CardFields = {};

  try {
    const dist = await timed(() =>
      runDistiller({
        cleanText: source.selectedText ?? source.cleanText,
        title: source.title,
        pageType: distillerPageType,
        retentionLevel,
        customPrompt: options.customPrompt,
      }),
    );
    timings.distiller_ms = dist.ms;
    summary = dist.result.summary;
    fields = dist.result as CardFields;
  } catch {
    summary = source.cleanText.slice(0, 200) + '…';
    timings.distiller_ms = 0;
  }

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

  const analysis: CardAnalysis = {
    pageType: effectivePageType as CardAnalysis['pageType'],
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
        preferredTemplate: options.preferredTemplate,
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
