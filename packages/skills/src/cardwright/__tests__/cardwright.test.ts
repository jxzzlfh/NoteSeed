import { describe, it, expect } from 'vitest';
import { run } from '../index.js';
import type { CardAnalysis } from '@noteseed/shared-types';

const baseMeta = {
  title: 'Test Article',
  url: 'https://example.com/test',
  author: 'Test Author',
  publishedAt: '2026-04-15',
};

function makeAnalysis(overrides: Partial<CardAnalysis> = {}): CardAnalysis {
  return {
    pageType: 'tutorial',
    confidence: 0.9,
    summary: 'This is a test summary about React performance.',
    fields: {
      prerequisites: ['Node.js installed', 'React basics'],
      steps: ['Install profiler', 'Run benchmark', 'Apply optimization'],
      warnings: ['Do not over-optimize'],
    },
    tags: ['#React', '#Performance'],
    suggestedTemplate: 'tutorial-v1',
    ...overrides,
  };
}

describe('Cardwright', () => {
  it('renders tutorial template', async () => {
    const result = await run({ analysis: makeAnalysis(), ...baseMeta });
    expect(result.markdown).toContain('Test Article');
    expect(result.markdown).toContain('摘要');
    expect(result.plainText.length).toBeGreaterThan(0);
    expect(result.wordCount).toBeGreaterThan(0);
  });

  it('renders opinion template', async () => {
    const result = await run({
      analysis: makeAnalysis({
        pageType: 'opinion',
        fields: {
          keyPoints: ['AI will transform education', 'Teachers will adapt'],
          quotes: ['Knowledge changes form, not substance'],
        },
      }),
      ...baseMeta,
    });
    expect(result.markdown).toContain('Test Article');
  });

  it('renders news template', async () => {
    const result = await run({
      analysis: makeAnalysis({
        pageType: 'news',
        fields: {
          whoWhatWhenWhere: 'Apple released M5 MacBook on 2026-04-15',
          keyFacts: ['Price: $1099', 'Battery: 24 hours'],
        },
      }),
      ...baseMeta,
    });
    expect(result.markdown).toContain('Test Article');
  });

  it('truncates for memos target', async () => {
    const longSummary = 'A'.repeat(2000);
    const result = await run({
      analysis: makeAnalysis({ summary: longSummary }),
      ...baseMeta,
      target: 'memos',
    });
    expect(result.plainText.length).toBeLessThanOrEqual(1501);
  });

  it('handles missing fields gracefully', async () => {
    const result = await run({
      analysis: makeAnalysis({ fields: {} }),
      ...baseMeta,
    });
    expect(result.markdown).toContain('Test Article');
    expect(result.markdown).not.toContain('undefined');
  });

  it('falls back to generic for unknown page type', async () => {
    const result = await run({
      analysis: makeAnalysis({ pageType: 'longform' as CardAnalysis['pageType'] }),
      ...baseMeta,
    });
    expect(result.markdown).toContain('Test Article');
  });
});
