import type { CardAnalysis, KnowledgeCard, PageSource } from '@noteseed/shared-types';

function pickPageType(source: PageSource): CardAnalysis['pageType'] {
  const t = `${source.title} ${source.cleanText}`.toLowerCase();
  if (/\b(news|breaking|头条)\b/i.test(t)) return 'news';
  if (/\b(tutorial|教程|how to)\b/i.test(t)) return 'tutorial';
  if (/\b(opinion|观点|editorial)\b/i.test(t)) return 'opinion';
  return 'tutorial';
}

export function buildMockKnowledgeCard(source: PageSource): KnowledgeCard {
  const now = new Date().toISOString();
  const pageType = pickPageType(source);
  const analysis: CardAnalysis = {
    pageType,
    confidence: 0.82,
    summary: source.cleanText.slice(0, 280).replace(/\s+/g, ' ').trim() || source.title,
    fields: {
      actionItems: [],
      facts: [],
    },
    tags: ['网页', '笔记'],
    category: '网页摘录',
    suggestedTemplate: 'balanced',
  };

  const body =
    source.cleanText.trim().slice(0, 8000) ||
    '_（页面正文为空，请尝试在正文区域重新识别。）_';

  const markdown = `# ${source.title}\n\n> ${analysis.summary}\n\n${body}\n`;

  return {
    id: crypto.randomUUID(),
    source,
    analysis,
    markdown,
    plainText: source.cleanText.slice(0, 12000),
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };
}
