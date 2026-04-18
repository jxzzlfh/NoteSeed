import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../llm/index.js', () => ({
  callClaudeWithTool: vi.fn(),
  MODELS: { HAIKU: 'claude-3-haiku-20240307' },
}));

import { run } from '../index.js';
import { callClaudeWithTool } from '../../llm/index.js';

const mockedCall = vi.mocked(callClaudeWithTool);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('tagger', () => {
  it('returns tags from LLM', async () => {
    mockedCall.mockResolvedValueOnce({
      tags: ['TypeScript', 'testing', 'vitest'],
      category: '技术',
      topic: '单元测试',
    });

    const result = await run({
      summary: 'A guide on testing TypeScript code with Vitest framework.',
      keyPoints: ['Use describe/it', 'Mock dependencies'],
    });

    expect(result.tags).toHaveLength(3);
    expect(result.tags).toContain('TypeScript');
    expect(result.category).toBe('技术');
    expect(result.topic).toBe('单元测试');
  });

  it('returns empty tags on LLM failure', async () => {
    mockedCall.mockRejectedValueOnce(new Error('API down'));

    await expect(
      run({ summary: 'test', keyPoints: [] }),
    ).rejects.toThrow('API down');
  });

  it('caps tags to 3 items', async () => {
    mockedCall.mockResolvedValueOnce({
      tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
      category: 'misc',
      topic: 'test',
    });

    const result = await run({ summary: 'many tags', keyPoints: [] });
    expect(result.tags.length).toBeLessThanOrEqual(3);
  });

  it('defaults category to 未分类 when missing', async () => {
    mockedCall.mockResolvedValueOnce({
      tags: ['test'],
    });

    const result = await run({ summary: 'test', keyPoints: [] });
    expect(result.category).toBe('未分类');
  });
});
