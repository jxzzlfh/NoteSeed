import type { KnowledgeCard, SaveRequest } from '@noteseed/shared-types';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { dispatch } from '../dispatcher.js';
import { FeishuAdapter } from '../feishu/index.js';
import { MemosAdapter } from '../memos/index.js';

function minimalCard(overrides: Partial<KnowledgeCard> = {}): KnowledgeCard {
  const now = new Date().toISOString();
  return {
    id: '00000000-0000-4000-8000-000000000001',
    source: {
      sourceId: '00000000-0000-4000-8000-000000000002',
      url: 'https://example.com/p',
      title: 'Title',
      cleanText: 'clean',
      metadata: { siteName: 'ex' },
      collectedAt: now,
    },
    analysis: {
      pageType: 'doc',
      confidence: 0.9,
      summary: 'summary',
      fields: {},
      tags: ['alpha'],
      suggestedTemplate: 'default',
    },
    markdown: '# Hello',
    plainText: 'Hello',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('dispatch', () => {
  const memosSave = vi.spyOn(MemosAdapter.prototype, 'save');
  const feishuSave = vi.spyOn(FeishuAdapter.prototype, 'save');

  afterEach(() => {
    memosSave.mockReset();
    feishuSave.mockReset();
  });

  it('returns aggregated results when all targets succeed', async () => {
    const t1 = new Date().toISOString();
    const t2 = new Date().toISOString();
    memosSave.mockResolvedValue({
      success: true,
      targetRef: 'memos/1',
      targetUrl: 'https://m.example/m/1',
      savedAt: t1,
    });
    feishuSave.mockResolvedValue({
      success: true,
      targetRef: 'doc1',
      targetUrl: 'https://feishu.cn/docx/doc1',
      savedAt: t2,
    });

    const req: SaveRequest = {
      requestId: 'req-1',
      card: minimalCard(),
      targets: ['memos', 'feishu'],
    };
    const resolver = vi.fn().mockResolvedValue({ ok: true });

    const out = await dispatch(req, resolver);

    expect(resolver).toHaveBeenCalledTimes(2);
    expect(out.requestId).toBe('req-1');
    expect(out.results).toHaveLength(2);
    expect(out.results[0]).toMatchObject({
      target: 'memos',
      success: true,
      targetRef: 'memos/1',
    });
    expect(out.results[1]).toMatchObject({
      target: 'feishu',
      success: true,
      targetRef: 'doc1',
    });
  });

  it('handles multiple targets with partial failure', async () => {
    memosSave.mockResolvedValue({
      success: false,
      error: 'memos down',
      savedAt: new Date().toISOString(),
    });
    feishuSave.mockResolvedValue({
      success: true,
      targetRef: 'docx',
      savedAt: new Date().toISOString(),
    });

    const req: SaveRequest = {
      requestId: 'req-2',
      card: minimalCard(),
      targets: ['memos', 'feishu'],
    };

    const out = await dispatch(req, async () => ({}));

    expect(out.results[0]?.success).toBe(false);
    expect(out.results[0]?.error).toBe('memos down');
    expect(out.results[1]?.success).toBe(true);
  });

  it('handles all targets failing', async () => {
    memosSave.mockResolvedValue({
      success: false,
      error: 'a',
      savedAt: new Date().toISOString(),
    });
    feishuSave.mockResolvedValue({
      success: false,
      error: 'b',
      savedAt: new Date().toISOString(),
    });

    const out = await dispatch(
      {
        requestId: 'req-3',
        card: minimalCard(),
        targets: ['memos', 'feishu'],
      },
      async () => ({}),
    );

    expect(out.results.every((r) => r.success === false)).toBe(true);
    expect(out.results.map((r) => r.error)).toEqual(['a', 'b']);
  });

  it('handles empty targets', async () => {
    const out = await dispatch(
      {
        requestId: 'req-empty',
        card: minimalCard(),
        targets: [],
      },
      async () => ({}),
    );
    expect(out.results).toEqual([]);
  });

  it('marks unknown targets as failed without calling adapters', async () => {
    memosSave.mockResolvedValue({
      success: true,
      savedAt: new Date().toISOString(),
    });

    const out = await dispatch(
      {
        requestId: 'req-unk',
        card: minimalCard(),
        targets: ['get', 'memos'],
      },
      async () => ({}),
    );

    expect(memosSave).toHaveBeenCalledTimes(1);
    expect(feishuSave).not.toHaveBeenCalled();
    expect(out.results).toHaveLength(2);
    expect(out.results[0]).toMatchObject({
      target: 'get',
      success: false,
    });
    expect(out.results[1]?.success).toBe(true);
  });
});
