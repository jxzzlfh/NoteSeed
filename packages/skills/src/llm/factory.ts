import type { AIProviderConfig } from '@noteseed/shared-types';
import { DEFAULT_ANTHROPIC_MODELS } from '@noteseed/shared-types';
import type { LLMProvider } from './provider.js';
import { AnthropicProvider } from './anthropic-client.js';
import { OpenAIProvider } from './openai-client.js';

export function createProvider(config: AIProviderConfig): LLMProvider {
  switch (config.provider) {
    case 'anthropic':
      return new AnthropicProvider(config.apiKey, config.baseUrl);
    case 'openai':
      return new OpenAIProvider(config.apiKey, config.baseUrl);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}

/**
 * Build an AIProviderConfig from environment variables (legacy fallback).
 * Returns null if ANTHROPIC_API_KEY is not set.
 */
export function configFromEnv(): AIProviderConfig | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === '') return null;

  return {
    provider: 'anthropic',
    apiKey: key,
    models: { ...DEFAULT_ANTHROPIC_MODELS },
  };
}
