import type { PageSource } from './page-source.js';
import type { CardAnalysis } from './card-analysis.js';

/**
 * KnowledgeCard — The core business object of NoteSeed.
 * A structured knowledge card generated from a web page.
 * @see PRD §9.1.3
 */
export type CardStatus = 'draft' | 'saved' | 'failed';

export interface KnowledgeCard {
  /** UUID v4 */
  id: string;
  source: PageSource;
  analysis: CardAnalysis;
  /** Final rendered Markdown output */
  markdown: string;
  /** Plain-text version (no Markdown syntax) */
  plainText: string;
  status: CardStatus;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}
