import type { CardAnalysis } from '@noteseed/shared-types';

import type { CardwrightRenderMeta } from '../meta.js';

function hashTags(tags: string[]): string {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ');
}

/**
 * Detailed template — comprehensive card with all available sections.
 * Uses opinion-distiller fields (quotes, counterArguments) for richer output.
 */
export function render(
  analysis: CardAnalysis,
  meta: CardwrightRenderMeta,
): { markdown: string; plainText: string } {
  const title = meta.title?.trim() || '无标题';
  const summary = analysis.summary.trim();
  const keyPoints = analysis.fields.keyPoints?.filter(Boolean) ?? [];
  const quotes = analysis.fields.quotes?.filter(Boolean) ?? [];
  const counter = analysis.fields.counterArguments?.filter(Boolean) ?? [];
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const mdParts: string[] = [`## ${title}`, '', '### 摘要', summary, ''];

  if (keyPoints.length) {
    mdParts.push('### 核心要点');
    keyPoints.forEach((s, i) => mdParts.push(`${i + 1}. ${s}`));
    mdParts.push('');
  }

  if (quotes.length) {
    mdParts.push('### 原文引述');
    quotes.forEach((q) => mdParts.push(`> ${q}`, ''));
  }

  if (counter.length) {
    mdParts.push('### 不同意见与局限', ...counter.map((s) => `- ${s}`), '');
  }

  mdParts.push('---');
  if (meta.url) mdParts.push(`来源: ${meta.url}`);
  if (tags.length) mdParts.push(hashTags(tags));

  const markdown = mdParts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();

  const plainParts: string[] = [title, '', '摘要', summary, ''];
  if (keyPoints.length) {
    plainParts.push('核心要点', ...keyPoints.map((s, i) => `${i + 1}. ${s}`), '');
  }
  if (quotes.length) {
    plainParts.push('原文引述', ...quotes, '');
  }
  if (counter.length) {
    plainParts.push('不同意见与局限', ...counter.map((s) => `- ${s}`), '');
  }
  plainParts.push('---');
  if (meta.url) plainParts.push(`来源: ${meta.url}`);
  if (tags.length) plainParts.push(hashTags(tags));

  return { markdown, plainText: plainParts.join('\n').trim() };
}
