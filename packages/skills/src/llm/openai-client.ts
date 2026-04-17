import type { LLMProvider, LLMCallParams, LLMCallResult, LLMToolDef } from './provider.js';

const MAX_ATTEMPTS = 3;
const INITIAL_BACKOFF_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 503 || status === 502;
}

interface OpenAIChatMessage {
  role: string;
  content?: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: OpenAIChatMessage;
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export class OpenAIProvider implements LLMProvider {
  readonly type = 'openai' as const;
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = (baseUrl ?? 'https://api.openai.com/v1').replace(/\/$/, '');
  }

  private async fetchWithRetries(
    url: string,
    body: Record<string, unknown>,
    label: string,
  ): Promise<OpenAIChatResponse> {
    let lastError: unknown;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        lastError = err;
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(INITIAL_BACKOFF_MS * 2 ** attempt);
          continue;
        }
        throw new Error(`${label} network error after ${attempt + 1} attempt(s): ${err}`);
      }

      if (res.ok) {
        return (await res.json()) as OpenAIChatResponse;
      }

      lastError = new Error(`${label}: HTTP ${res.status} — ${await res.text()}`);

      if (!isRetryable(res.status) || attempt >= MAX_ATTEMPTS - 1) {
        throw lastError;
      }

      await sleep(INITIAL_BACKOFF_MS * 2 ** attempt);
    }

    throw lastError ?? new Error(`${label}: exhausted retries`);
  }

  async chat(params: LLMCallParams): Promise<LLMCallResult> {
    const { model, systemPrompt, userPrompt, temperature, maxTokens } = params;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens ?? 4096,
    };
    if (temperature !== undefined) body.temperature = temperature;

    const data = await this.fetchWithRetries(
      `${this.baseUrl}/chat/completions`,
      body,
      'openai.chat',
    );

    const text = data.choices?.[0]?.message?.content ?? '';
    return {
      text: text.trim(),
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }

  async chatWithTool(
    params: LLMCallParams,
    tool: LLMToolDef,
  ): Promise<Record<string, unknown>> {
    const { model, systemPrompt, userPrompt, temperature, maxTokens } = params;

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens ?? 4096,
      tools: [
        {
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
          },
        },
      ],
      tool_choice: { type: 'function', function: { name: tool.name } },
    };
    if (temperature !== undefined) body.temperature = temperature;

    const data = await this.fetchWithRetries(
      `${this.baseUrl}/chat/completions`,
      body,
      'openai.chatWithTool',
    );

    const msg = data.choices?.[0]?.message;
    const toolCall = msg?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        throw new Error(
          `openai.chatWithTool: failed to parse tool arguments: ${toolCall.function.arguments}`,
        );
      }
    }

    // Fallback: try parsing JSON from content (some providers return JSON in content)
    const content = msg?.content;
    if (typeof content === 'string' && content.trim()) {
      try {
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // not JSON
      }
    }

    throw new Error('openai.chatWithTool: no valid tool call in response');
  }
}
