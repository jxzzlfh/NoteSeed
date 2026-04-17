import type { AIProviderConfig } from '@noteseed/shared-types';

/**
 * Unified LLM call parameters (provider-agnostic).
 */
export interface LLMCallParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCallResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface LLMToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Abstract LLM provider that both Anthropic and OpenAI clients implement.
 */
export interface LLMProvider {
  readonly type: AIProviderConfig['provider'];
  chat(params: LLMCallParams): Promise<LLMCallResult>;
  chatWithTool(params: LLMCallParams, tool: LLMToolDef): Promise<Record<string, unknown>>;
}

let _activeProvider: LLMProvider | null = null;

export function setActiveProvider(provider: LLMProvider): void {
  _activeProvider = provider;
}

export function getActiveProvider(): LLMProvider | null {
  return _activeProvider;
}

export function clearActiveProvider(): void {
  _activeProvider = null;
}
