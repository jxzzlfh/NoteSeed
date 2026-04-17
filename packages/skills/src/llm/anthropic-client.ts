import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsNonStreaming } from '@anthropic-ai/sdk/resources/messages.js';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import type { LLMProvider, LLMCallParams, LLMCallResult, LLMToolDef } from './provider.js';

const MAX_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function withRetries<T>(label: string, fn: () => Promise<T>): Promise<T> {
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

      await sleep(INITIAL_BACKOFF_MS * 2 ** attempt);
    }
  }

  const fallback = new Error(`${label}: exhausted retries without success`);
  (fallback as Error & { cause?: unknown }).cause = lastError;
  throw fallback;
}

function extractToolInput(
  content: Anthropic.Messages.ContentBlock[],
  toolName: string,
): unknown {
  for (const block of content) {
    if (block.type === 'tool_use' && block.name === toolName) {
      return block.input;
    }
  }
  return undefined;
}

export class AnthropicProvider implements LLMProvider {
  readonly type = 'anthropic' as const;
  private client: Anthropic;

  constructor(apiKey: string, baseUrl?: string) {
    const options: Record<string, unknown> = { apiKey };
    if (baseUrl) options.baseURL = baseUrl;
    this.client = new Anthropic(options as ConstructorParameters<typeof Anthropic>[0]);
  }

  private async messagesCreate(
    params: MessageCreateParamsNonStreaming,
  ): Promise<Anthropic.Messages.Message> {
    return withRetries('anthropic.messages.create', () => this.client.messages.create(params));
  }

  async chat(params: LLMCallParams): Promise<LLMCallResult> {
    const { model, systemPrompt, userPrompt, temperature, maxTokens } = params;

    const response = await this.messagesCreate({
      model,
      max_tokens: maxTokens ?? 4096,
      system: systemPrompt,
      temperature,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text',
    );
    const text = textBlocks.map((b) => b.text).join('').trim();

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async chatWithTool(
    params: LLMCallParams,
    tool: LLMToolDef,
  ): Promise<Record<string, unknown>> {
    const { model, systemPrompt, userPrompt, temperature, maxTokens } = params;

    const response = await this.messagesCreate({
      model,
      max_tokens: maxTokens ?? 4096,
      system: systemPrompt,
      temperature,
      messages: [{ role: 'user', content: userPrompt }],
      tools: [
        {
          name: tool.name,
          description: tool.description,
          input_schema: tool.inputSchema as Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: tool.name, disable_parallel_tool_use: true },
    });

    const rawInput = extractToolInput(response.content, tool.name);
    if (rawInput === null || rawInput === undefined) {
      throw new Error(
        `anthropic.chatWithTool: model did not return a tool_use block for "${tool.name}"`,
      );
    }
    if (typeof rawInput !== 'object' || Array.isArray(rawInput)) {
      throw new Error('anthropic.chatWithTool: tool input must be a JSON object');
    }

    return rawInput as Record<string, unknown>;
  }
}
