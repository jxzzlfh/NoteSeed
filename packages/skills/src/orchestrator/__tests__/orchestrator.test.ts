import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PageSource } from '@noteseed/shared-types';

vi.mock('../../page-sense/index.js', () => ({
  run: vi.fn().mockResolvedValue({
    pageType: 'tutorial',
    confidence: 0.9,
    suggestedTemplate: 'tutorial-v1',
  }),
}));

vi.mock('../../contextualizer/index.js', () => ({
  run: vi.fn().mockResolvedValue({
    author: 'Test Author',
    publishedAt: '2024-01-01T00:00:00Z',
    language: 'zh-CN',
    readingTime: '5 min',
  }),
}));

vi.mock('../../distiller/index.js', () => ({
  run: vi.fn().mockResolvedValue({
    summary: 'A short summary',
    keyPoints: ['Point 1', 'Point 2'],
  }),
}));

vi.mock('../../tagger/index.js', () => ({
  run: vi.fn().mockResolvedValue({
    tags: ['test', 'tutorial'],
    category: '技术',
    topic: '测试',
  }),
}));

vi.mock('../../cardwright/index.js', () => ({
  run: vi.fn().mockResolvedValue({
    markdown: '# Test Title\n\nA short summary',
    plainText: 'Test Title\n\nA short summary',
    wordCount: 10,
  }),
}));

import { generateCard } from '../index.js';

beforeEach(() => {
  vi.clearAllMocks();
});

const mockSource: PageSource = {
  sourceId: '00000000-0000-0000-0000-000000000001',
  url: 'https://example.com/tutorial',
  title: 'Test Tutorial',
  cleanText: 'This is a long tutorial about testing patterns in TypeScript...',
  metadata: {
    siteName: 'example.com',
    author: 'Original Author',
  },
  collectedAt: '2024-01-01T00:00:00Z',
};

describe('orchestrator', () => {
  it('runs the full pipeline and returns a KnowledgeCard', async () => {
    const { card, timings } = await generateCard(mockSource);

    expect(card).toBeDefined();
    expect(card.id).toBeTruthy();
    expect(card.source.url).toBe('https://example.com/tutorial');
    expect(card.analysis.pageType).toBe('tutorial');
    expect(card.analysis.tags).toEqual(['test', 'tutorial']);
    expect(card.markdown).toContain('Test Title');
    expect(card.status).toBe('draft');
    expect(timings.total_ms).toBeGreaterThanOrEqual(0);
  });

  it('respects preferredTemplate option', async () => {
    const { card } = await generateCard(mockSource, { preferredTemplate: 'custom-v1' });
    expect(card.analysis.suggestedTemplate).toBe('custom-v1');
  });

  it('returns timing data for each skill', async () => {
    const { timings } = await generateCard(mockSource);
    expect(timings).toHaveProperty('pageSense_ms');
    expect(timings).toHaveProperty('contextualizer_ms');
    expect(timings).toHaveProperty('distiller_ms');
    expect(timings).toHaveProperty('tagger_ms');
    expect(timings).toHaveProperty('cardwright_ms');
    expect(timings).toHaveProperty('total_ms');
  });
});
