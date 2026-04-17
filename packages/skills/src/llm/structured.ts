import type Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import type { CallClaudeParams } from './client.js';
import { runAnthropicMessagesCreate } from './client.js';

const DEFAULT_TOOL_NAME = 'emit_structured_json';

function stripJsonSchemaMeta(schema: Record<string, unknown>): Record<string, unknown> {
  const { $schema, definitions, ...rest } = schema;
  void $schema;
  void definitions;
  return rest;
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

export interface CallClaudeStructuredOptions {
  /** Anthropic tool name (default: emit_structured_json) */
  toolName?: string;
  /** Short description for the tool (helps model compliance) */
  toolDescription?: string;
}

/**
 * Calls Claude with a forced `tool_use` block and validates the payload with Zod.
 */
export async function callClaudeStructured<T>(
  params: CallClaudeParams,
  toolSchema: z.ZodType<T>,
  options?: CallClaudeStructuredOptions,
): Promise<T> {
  const toolName = options?.toolName ?? DEFAULT_TOOL_NAME;
  const toolDescription =
    options?.toolDescription ?? 'Emit the structured JSON result as valid tool input.';

  const rawSchema = zodToJsonSchema(toolSchema, {
    target: 'jsonSchema7',
    $refStrategy: 'none',
  }) as Record<string, unknown>;
  const inputSchema = stripJsonSchemaMeta(rawSchema) as Tool.InputSchema;

  const { model, systemPrompt, userPrompt, temperature, maxTokens } = params;
  const maxTokensResolved = maxTokens ?? 4096;

  const response = await runAnthropicMessagesCreate({
    model,
    max_tokens: maxTokensResolved,
    system: systemPrompt,
    temperature,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: toolName, disable_parallel_tool_use: true },
  });

  const rawInput = extractToolInput(response.content, toolName);
  if (rawInput === undefined) {
    throw new Error(
      'callClaudeStructured: model did not return a matching tool_use block',
    );
  }

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
  inputSchema: Tool.InputSchema;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Calls Claude with a single forced `tool_use` and returns the tool input object (unvalidated JSON).
 * Used when the schema is already an Anthropic `input_schema` (e.g. Distiller, Tagger).
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

  const response = await runAnthropicMessagesCreate({
    model,
    max_tokens: maxTokens ?? 4096,
    system: systemPrompt,
    temperature,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [
      {
        name: toolName,
        description: toolDescription,
        input_schema: inputSchema,
      },
    ],
    tool_choice: { type: 'tool', name: toolName, disable_parallel_tool_use: true },
  });

  const rawInput = extractToolInput(response.content, toolName);
  if (rawInput === null || rawInput === undefined) {
    throw new Error(
      `callClaudeWithTool: model did not return a matching tool_use block for "${toolName}"`,
    );
  }
  if (typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    throw new Error('callClaudeWithTool: tool input must be a JSON object');
  }

  return rawInput as Record<string, unknown>;
}
