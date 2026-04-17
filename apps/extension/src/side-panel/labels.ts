import type { PageType } from '@noteseed/shared-types';

export const PAGE_TYPE_LABELS: Record<PageType, string> = {
  tutorial: '教程',
  opinion: '观点',
  news: '资讯',
  doc: '文档',
  tool: '工具',
  resource: '资源',
  longform: '长文',
  discussion: '讨论',
};

export const TEMPLATE_OPTIONS: { id: string; label: string }[] = [
  { id: 'balanced', label: '平衡' },
  { id: 'concise', label: '精简' },
  { id: 'detailed', label: '详细' },
  { id: 'tutorial', label: '教程提炼' },
  { id: 'opinion', label: '观点摘要' },
];
