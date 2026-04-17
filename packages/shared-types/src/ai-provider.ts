/**
 * AI Provider configuration types.
 * Supports Anthropic-compatible and OpenAI-compatible APIs.
 */

export type AIProviderType = 'anthropic' | 'openai';

export interface AIModelMapping {
  /** Model ID for fast/cheap tasks (PageSense, Contextualizer, Tagger) */
  fast: string;
  /** Model ID for powerful tasks (Distiller) */
  powerful: string;
}

export interface AIProviderConfig {
  provider: AIProviderType;
  apiKey: string;
  /** Custom API base URL (e.g. https://api.openai.com/v1, or any compatible endpoint) */
  baseUrl?: string;
  models: AIModelMapping;
}

export const DEFAULT_ANTHROPIC_MODELS: AIModelMapping = {
  fast: 'claude-haiku-4-5-20251001',
  powerful: 'claude-sonnet-4-6',
};

export const DEFAULT_OPENAI_MODELS: AIModelMapping = {
  fast: 'gpt-4o-mini',
  powerful: 'gpt-4o',
};
