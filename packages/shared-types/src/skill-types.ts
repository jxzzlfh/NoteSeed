import type { PageType } from './card-analysis.js';

/**
 * Shared types for Skills pipeline I/O.
 */

/** Output of Skill 1: PageSense */
export interface PageSenseOutput {
  pageType: PageType;
  confidence: number;
  suggestedTemplate: string;
  signals: string[];
}

/** Output of Skill 2: Contextualizer */
export interface ContextualizerOutput {
  author?: string;
  publishedAt?: string;
  language: string;
  readingTime: string;
  sourceCredibility?: 'high' | 'medium' | 'low';
  relatedSeriesTitle?: string;
}

/** Output of Skill 4: Tagger */
export interface TaggerOutput {
  tags: string[];
  category: string;
  topic: string;
  noveltyScore?: number;
}

/** Output of Skill 5: Cardwright */
export interface CardwrightOutput {
  markdown: string;
  plainText: string;
  wordCount: number;
  estimatedMemosLength: number;
}

/** Timing information for the Skills pipeline */
export interface PipelineTimings {
  pageSense_ms: number;
  contextualizer_ms: number;
  distiller_ms: number;
  tagger_ms: number;
  cardwright_ms: number;
  total_ms: number;
}
