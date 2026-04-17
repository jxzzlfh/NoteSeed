/**
 * @noteseed/shared-types
 * Shared TypeScript types and Zod schemas for the NoteSeed ecosystem.
 * @see PRD §9 for the KnowledgeCard v1 protocol specification.
 */

// Core types
export type { PageSource, PageSourceMetadata } from './page-source.js';
export type {
  CardAnalysis,
  CardFields,
  TutorialFields,
  OpinionFields,
  NewsFields,
  DocFields,
  ToolFields,
  ResourceFields,
  LongformFields,
  DiscussionFields,
} from './card-analysis.js';
export { PAGE_TYPES } from './card-analysis.js';
export type { PageType } from './card-analysis.js';
export type { KnowledgeCard, CardStatus } from './knowledge-card.js';
export type {
  SaveRequest,
  SaveResult,
  SaveTargetResult,
  SaveOptions,
  MemosOptions,
  FeishuOptions,
} from './save.js';
export { SAVE_TARGETS } from './save.js';
export type { SaveTarget, MemosVisibility, MemosRenderMode } from './save.js';
export type {
  UserSettings,
  UserStyleProfile,
  SkillToggles,
  RetentionLevel,
} from './user-settings.js';
export { ERROR_CODES } from './errors.js';
export type { ErrorCode, NoteSeedError } from './errors.js';

// AI Provider types
export type { AIProviderType, AIModelMapping, AIProviderConfig } from './ai-provider.js';
export { DEFAULT_ANTHROPIC_MODELS, DEFAULT_OPENAI_MODELS } from './ai-provider.js';

// Skill I/O types
export type {
  PageSenseOutput,
  ContextualizerOutput,
  TaggerOutput,
  CardwrightOutput,
  PipelineTimings,
} from './skill-types.js';

// Schemas (will be populated in Task 1.2)
export * from './schemas/index.js';
