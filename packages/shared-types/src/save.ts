import type { KnowledgeCard } from './knowledge-card.js';

/**
 * Save-related types for the Dispatcher skill.
 * @see PRD §9.1.4
 */

export const SAVE_TARGETS = ['memos', 'feishu', 'get', 'ksdoc'] as const;
export type SaveTarget = (typeof SAVE_TARGETS)[number];

export type MemosVisibility = 'private' | 'public';
export type MemosRenderMode = 'compact' | 'full';

export interface MemosOptions {
  visibility: MemosVisibility;
  renderMode: MemosRenderMode;
}

export interface FeishuOptions {
  folderToken?: string;
}

export interface SaveOptions {
  memos?: MemosOptions;
  feishu?: FeishuOptions;
}

export interface SaveRequest {
  /** UUID v4 */
  requestId: string;
  card: KnowledgeCard;
  targets: SaveTarget[];
  options?: SaveOptions;
}

export interface SaveTargetResult {
  target: SaveTarget;
  success: boolean;
  /** Reference ID in the target system */
  targetRef?: string;
  /** URL to the saved item in the target system */
  targetUrl?: string;
  error?: string;
  /** ISO 8601 */
  savedAt: string;
}

export interface SaveResult {
  requestId: string;
  results: SaveTargetResult[];
}
