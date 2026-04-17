import { describe, it, expect } from 'vitest';
import { PageSourceSchema } from '../page-source.schema.js';
import { CardAnalysisSchema, PageTypeSchema } from '../card-analysis.schema.js';
import { KnowledgeCardSchema } from '../knowledge-card.schema.js';
import { SaveRequestSchema, SaveResultSchema } from '../save.schema.js';

const validPageSource = {
  sourceId: '550e8400-e29b-41d4-a716-446655440000',
  url: 'https://example.com/tutorial',
  title: 'React Performance Guide',
  cleanText: 'This is a tutorial about React performance optimization...',
  metadata: {
    siteName: 'Example Blog',
    author: 'Zhang San',
    publishedAt: '2026-04-15T10:00:00Z',
    language: 'zh-CN',
  },
  collectedAt: '2026-04-16T08:30:00Z',
};

const validCardAnalysis = {
  pageType: 'tutorial' as const,
  confidence: 0.92,
  summary: 'A comprehensive guide to optimizing React performance.',
  fields: {
    prerequisites: ['React basics', 'JavaScript ES6+'],
    steps: ['Install profiler', 'Identify bottlenecks', 'Apply useMemo'],
    warnings: ['Do not over-optimize prematurely'],
  },
  tags: ['#React', '#Performance', '#Frontend'],
  category: '技术/前端',
  suggestedTemplate: 'tutorial-v1',
};

const validKnowledgeCard = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  source: validPageSource,
  analysis: validCardAnalysis,
  markdown: '# React Performance Guide\n\n## Summary\n...',
  plainText: 'React Performance Guide\n\nSummary\n...',
  status: 'draft' as const,
  createdAt: '2026-04-16T08:31:00Z',
  updatedAt: '2026-04-16T08:31:00Z',
};

describe('PageSourceSchema', () => {
  it('accepts a valid PageSource', () => {
    const result = PageSourceSchema.safeParse(validPageSource);
    expect(result.success).toBe(true);
  });

  it('accepts PageSource without optional fields', () => {
    const minimal = {
      sourceId: '550e8400-e29b-41d4-a716-446655440000',
      url: 'https://example.com',
      title: 'Test',
      cleanText: 'Some content',
      metadata: { siteName: 'Example' },
      collectedAt: '2026-04-16T08:30:00Z',
    };
    const result = PageSourceSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('rejects invalid URL', () => {
    const invalid = { ...validPageSource, url: 'not-a-url' };
    const result = PageSourceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID', () => {
    const invalid = { ...validPageSource, sourceId: 'not-a-uuid' };
    const result = PageSourceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty title', () => {
    const invalid = { ...validPageSource, title: '' };
    const result = PageSourceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid datetime', () => {
    const invalid = { ...validPageSource, collectedAt: 'yesterday' };
    const result = PageSourceSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('PageTypeSchema', () => {
  it('accepts all 8 valid page types', () => {
    const types = [
      'tutorial',
      'opinion',
      'news',
      'doc',
      'tool',
      'resource',
      'longform',
      'discussion',
    ];
    for (const t of types) {
      expect(PageTypeSchema.safeParse(t).success).toBe(true);
    }
  });

  it('rejects invalid page type', () => {
    expect(PageTypeSchema.safeParse('blog').success).toBe(false);
    expect(PageTypeSchema.safeParse('').success).toBe(false);
  });
});

describe('CardAnalysisSchema', () => {
  it('accepts a valid CardAnalysis', () => {
    const result = CardAnalysisSchema.safeParse(validCardAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects confidence out of range', () => {
    const invalid = { ...validCardAnalysis, confidence: 1.5 };
    const result = CardAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects negative confidence', () => {
    const invalid = { ...validCardAnalysis, confidence: -0.1 };
    const result = CardAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty tags', () => {
    const invalid = { ...validCardAnalysis, tags: [] };
    const result = CardAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects too many tags (>10)', () => {
    const invalid = {
      ...validCardAnalysis,
      tags: Array.from({ length: 11 }, (_, i) => `#tag${i}`),
    };
    const result = CardAnalysisSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('accepts opinion fields', () => {
    const opinion = {
      ...validCardAnalysis,
      pageType: 'opinion',
      fields: {
        keyPoints: ['Point 1', 'Point 2'],
        quotes: ['Quote 1'],
        counterArguments: ['Counter 1'],
      },
    };
    const result = CardAnalysisSchema.safeParse(opinion);
    expect(result.success).toBe(true);
  });

  it('accepts doc fields with params', () => {
    const doc = {
      ...validCardAnalysis,
      pageType: 'doc',
      fields: {
        apiSignature: 'POST /api/v1/cards',
        params: [{ name: 'title', type: 'string', desc: 'Card title' }],
        examples: ['curl -X POST ...'],
      },
    };
    const result = CardAnalysisSchema.safeParse(doc);
    expect(result.success).toBe(true);
  });
});

describe('KnowledgeCardSchema', () => {
  it('accepts a valid KnowledgeCard', () => {
    const result = KnowledgeCardSchema.safeParse(validKnowledgeCard);
    expect(result.success).toBe(true);
  });

  it('rejects invalid status', () => {
    const invalid = { ...validKnowledgeCard, status: 'pending' };
    const result = KnowledgeCardSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects empty markdown', () => {
    const invalid = { ...validKnowledgeCard, markdown: '' };
    const result = KnowledgeCardSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('SaveRequestSchema', () => {
  it('accepts a valid SaveRequest', () => {
    const req = {
      requestId: '770e8400-e29b-41d4-a716-446655440002',
      card: validKnowledgeCard,
      targets: ['memos'],
      options: {
        memos: { visibility: 'private', renderMode: 'compact' },
      },
    };
    const result = SaveRequestSchema.safeParse(req);
    expect(result.success).toBe(true);
  });

  it('accepts multiple targets', () => {
    const req = {
      requestId: '770e8400-e29b-41d4-a716-446655440002',
      card: validKnowledgeCard,
      targets: ['memos', 'feishu'],
    };
    const result = SaveRequestSchema.safeParse(req);
    expect(result.success).toBe(true);
  });

  it('rejects empty targets array', () => {
    const req = {
      requestId: '770e8400-e29b-41d4-a716-446655440002',
      card: validKnowledgeCard,
      targets: [],
    };
    const result = SaveRequestSchema.safeParse(req);
    expect(result.success).toBe(false);
  });

  it('rejects invalid target', () => {
    const req = {
      requestId: '770e8400-e29b-41d4-a716-446655440002',
      card: validKnowledgeCard,
      targets: ['notion'],
    };
    const result = SaveRequestSchema.safeParse(req);
    expect(result.success).toBe(false);
  });
});

describe('SaveResultSchema', () => {
  it('accepts a valid SaveResult', () => {
    const res = {
      requestId: '770e8400-e29b-41d4-a716-446655440002',
      results: [
        {
          target: 'memos',
          success: true,
          targetRef: 'memo_123',
          targetUrl: 'https://memos.example.com/m/123',
          savedAt: '2026-04-16T08:32:00Z',
        },
      ],
    };
    const result = SaveResultSchema.safeParse(res);
    expect(result.success).toBe(true);
  });

  it('accepts a failed result', () => {
    const res = {
      requestId: '770e8400-e29b-41d4-a716-446655440002',
      results: [
        {
          target: 'feishu',
          success: false,
          error: 'Token expired',
          savedAt: '2026-04-16T08:32:00Z',
        },
      ],
    };
    const result = SaveResultSchema.safeParse(res);
    expect(result.success).toBe(true);
  });
});
