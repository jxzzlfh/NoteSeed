import type { LLMProvider, LLMCallParams, LLMCallResult } from './provider.js';
import { getActiveProvider } from './provider.js';
import { configFromEnv, createProvider } from './factory.js';

export type { LLMCallParams as CallClaudeParams };
export type { LLMCallResult as CallClaudeResult };

function resolveProvider(): LLMProvider {
  const active = getActiveProvider();
  if (active) return active;

  const envConfig = configFromEnv();
  if (!envConfig) {
    throw new Error(
      'No AI provider configured. Set ANTHROPIC_API_KEY or configure a custom provider.',
    );
  }
  return createProvider(envConfig);
}

/**
 * Simple text completion via the active provider.
 * Backwards-compatible with existing `callClaude` callsites.
 */
export async function callClaude(params: LLMCallParams): Promise<LLMCallResult> {
  return resolveProvider().chat(params);
}
