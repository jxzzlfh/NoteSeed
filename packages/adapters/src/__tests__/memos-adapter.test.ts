import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../memos/client.js', () => ({
  createMemo: vi.fn(),
  validateToken: vi.fn(),
}));

import { MemosAdapter } from '../memos/index.js';
import { createMemo, validateToken } from '../memos/client.js';
import type { AdapterSaveRequest } from '../types.js';
import type { KnowledgeCard } from '@noteseed/shared-types';

const mockedCreateMemo = vi.mocked(createMemo);
const mockedValidateToken = vi.mocked(validateToken);

const adapter = new MemosAdapter();

const mockCard: KnowledgeCard = {
  id: 'card-001',
  source: {
    sourceId: 'src-001',
    url: 'https://example.com',
    title: 'Test',
    cleanText: 'Test content',
    metadata: { siteName: 'example.com' },
    collectedAt: '2024-01-01T00:00:00Z',
  },
  analysis: {
    pageType: 'resource',
    confidence: 0.8,
    summary: 'Test summary',
    fields: {},
    tags: ['test'],
    suggestedTemplate: 'generic-v1',
  },
  markdown: '# Test\n\nContent here',
  plainText: 'Test\n\nContent here',
  status: 'draft',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('MemosAdapter', () => {
  it('has target "memos"', () => {
    expect(adapter.target).toBe('memos');
  });

  it('saves a card via createMemo', async () => {
    mockedCreateMemo.mockResolvedValueOnce({ name: 'memos/123' });

    const req: AdapterSaveRequest = {
      card: mockCard,
      markdown: mockCard.markdown,
      options: { credential: { baseUrl: 'https://memos.test', accessToken: 'abc' } },
    };

    const result = await adapter.save(req);
    expect(result.success).toBe(true);
    expect(result.targetRef).toBe('memos/123');
    expect(mockedCreateMemo).toHaveBeenCalledOnce();
  });

  it('returns error when credential is missing', async () => {
    const req: AdapterSaveRequest = {
      card: mockCard,
      markdown: mockCard.markdown,
      options: { credential: null },
    };

    const result = await adapter.save(req);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns error when credential has wrong shape', async () => {
    const req: AdapterSaveRequest = {
      card: mockCard,
      markdown: mockCard.markdown,
      options: { credential: { host: 'abc' } },
    };

    const result = await adapter.save(req);
    expect(result.success).toBe(false);
  });

  it('validates token', async () => {
    mockedValidateToken.mockResolvedValueOnce(true);
    const valid = await adapter.validate({ baseUrl: 'https://memos.test', accessToken: 'abc' });
    expect(valid).toBe(true);
  });

  it('returns false for invalid credential in validate', async () => {
    const valid = await adapter.validate(null);
    expect(valid).toBe(false);
  });
});
