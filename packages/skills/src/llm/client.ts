import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages.js';

export interface CallClaudeParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface CallClaudeResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
}

/** Non-streaming Messages API params (avoids `Message | Stream` union from overloads). */
export type AnthropicMessageCreateParams = MessageCreateParamsNonStreaming;

const MAX_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === '') {
    throw new Error('ANTHROPIC_API_KEY is not set or empty');
  }
  return key;
}

function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 503 || status === 529;
}

function getHttpStatus(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'status' in error) {
    const s = (error as { status?: number }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

let clientSingleton: Anthropic | null = null;

function getClient(): Anthropic {
  if (!clientSingleton) {
    clientSingleton = new Anthropic({ apiKey: getApiKey() });
  }
  return clientSingleton;
}

async function withAnthropicRetries<T>(label: string, fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = getHttpStatus(err);
      const retryable = isRetryableStatus(status);
      const hasMoreAttempts = attempt < MAX_ATTEMPTS - 1;

      if (!retryable || !hasMoreAttempts) {
        const message =
          err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
        const wrapped = new Error(
          `${label} failed after ${attempt + 1} attempt(s): ${message}`,
        );
        (wrapped as Error & { cause?: unknown }).cause = err;
        throw wrapped;
      }

      const delay = INITIAL_BACKOFF_MS * 2 ** attempt;
      await sleep(delay);
    }
  }

  const fallback = new Error(`${label}: exhausted retries without success`);
  (fallback as Error & { cause?: unknown }).cause = lastError;
  throw fallback;
}

/**
 * Low-level Messages API call with automatic retries (exponential backoff, 3 attempts)
 * for rate limits (429) and transient overloads.
 */
export async function runAnthropicMessagesCreate(
  params: AnthropicMessageCreateParams,
): Promise<Anthropic.Messages.Message> {
  return withAnthropicRetries('messages.create', () => getClient().messages.create(params));
}

/**
 * Calls the Anthropic Messages API with automatic retries (exponential backoff)
 * for rate limits (429) and transient overloads.
 */
export async function callClaude(params: CallClaudeParams): Promise<CallClaudeResult> {
  const { model, systemPrompt, userPrompt, temperature, maxTokens } = params;
  const maxTokensResolved = maxTokens ?? 4096;

  const response = await runAnthropicMessagesCreate({
    model,
    max_tokens: maxTokensResolved,
    system: systemPrompt,
    temperature,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlocks = response.content.filter(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  const text = textBlocks.map((b) => b.text).join('').trim();

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  return { text, usage };
}
