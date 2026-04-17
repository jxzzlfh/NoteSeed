import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import type { LLMCallParams } from './provider.js';
import { getActiveProvider } from './provider.js';
import { configFromEnv, createProvider } from './factory.js';
import type { LLMProvider } from './provider.js';

function stripJsonSchemaMeta(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema, definitions, ...rest } = schema;
  void $schema;
  void definitions;
  return rest;
}

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

export interface CallClaudeStructuredOptions {
  toolName?: string;
  toolDescription?: string;
}

/**
 * Calls the active LLM with a forced tool call and validates the payload with Zod.
 */
export async function callClaudeStructured<T>(
  params: LLMCallParams,
  toolSchema: z.ZodType<T>,
  options?: CallClaudeStructuredOptions,
): Promise<T> {
  const toolName = options?.toolName ?? 'emit_structured_json';
  const toolDescription =
    options?.toolDescription ?? 'Emit the structured JSON result as valid tool input.';

  const rawSchema = zodToJsonSchema(toolSchema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  }) as Record<string, unknown>;
  const inputSchema = stripJsonSchemaMeta(rawSchema);

  const provider = resolveProvider();
  const rawInput = await provider.chatWithTool(params, {
    name: toolName,
    description: toolDescription,
    inputSchema,
  });

  const parsed = toolSchema.safeParse(rawInput);
  if (!parsed.success) {
    const msg = parsed.error.flatten();
    const err = new Error(
      `callClaudeStructured: Zod validation failed: ${JSON.stringify(msg)}`,
    );
    (err as Error & { cause?: unknown }).cause = parsed.error;
    throw err;
  }

  return parsed.data;
}

export interface CallClaudeWithToolParams {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Calls the active LLM with a single forced tool call and returns the raw JSON object.
 */
export async function callClaudeWithTool(
  params: CallClaudeWithToolParams,
): Promise<Record<string, unknown>> {
  const {
    model,
    systemPrompt,
    userPrompt,
    toolName,
    toolDescription,
    inputSchema,
    temperature,
    maxTokens,
  } = params;

  const provider = resolveProvider();
  return provider.chatWithTool(
    { model, systemPrompt, userPrompt, temperature, maxTokens },
    { name: toolName, description: toolDescription, inputSchema },
  );
}
