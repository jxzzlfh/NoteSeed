import type { AIModelMapping } from '@noteseed/shared-types';
import { DEFAULT_ANTHROPIC_MODELS } from '@noteseed/shared-types';

/**
 * Default model IDs (Anthropic). These are used when no custom provider is configured.
 */
export const MODELS = {
  HAIKU: DEFAULT_ANTHROPIC_MODELS.fast,
  SONNET: DEFAULT_ANTHROPIC_MODELS.powerful,
} as const;

export type ModelId = string;

let _activeModels: AIModelMapping | null = null;

export function setActiveModels(models: AIModelMapping): void {
  _activeModels = models;
}

export function clearActiveModels(): void {
  _activeModels = null;
}

/** Resolve the "fast" model ID (for PageSense, Contextualizer, Tagger) */
export function getFastModel(): string {
  return _activeModels?.fast ?? MODELS.HAIKU;
}

/** Resolve the "powerful" model ID (for Distiller) */
export function getPowerfulModel(): string {
  return _activeModels?.powerful ?? MODELS.SONNET;
}
