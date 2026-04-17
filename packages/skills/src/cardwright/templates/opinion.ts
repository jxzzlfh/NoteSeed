import type { CardAnalysis } from '@noteseed/shared-types';

import type { CardwrightRenderMeta } from '../meta.js';

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

  const mdParts: string[] = [`# ${title}`, '', '## 摘要', summary, ''];

  if (keyPoints.length) {
    mdParts.push('## 要点', ...keyPoints.map((s) => `- ${s}`), '');
  }
  if (quotes.length) {
    mdParts.push('## 引述', ...quotes.map((s) => `> ${s}`), '');
  }
  if (counter.length) {
    mdParts.push('## 不同意见与局限', ...counter.map((s) => `- ${s}`), '');
  }

  const footerBits: string[] = [];
  if (meta.url) footerBits.push(`来源: ${meta.url}`);
  if (meta.author) footerBits.push(meta.author);
  if (meta.publishedAt) footerBits.push(meta.publishedAt);
  const footerLine = footerBits.join(' · ');
  mdParts.push('---');
  if (footerLine) mdParts.push(footerLine);
  if (tags.length) mdParts.push(`标签: ${tags.join(' · ')}`);

  const markdown = mdParts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();

  const plainParts: string[] = [title, '', '摘要', summary, ''];
  if (keyPoints.length) {
    plainParts.push('要点', ...keyPoints.map((s) => `- ${s}`), '');
  }
  if (quotes.length) {
    plainParts.push('引述', ...quotes, '');
  }
  if (counter.length) {
    plainParts.push('不同意见与局限', ...counter.map((s) => `- ${s}`), '');
  }
  plainParts.push('---');
  if (footerLine) plainParts.push(footerLine);
  if (tags.length) plainParts.push(`标签: ${tags.join(' · ')}`);

  return { markdown, plainText: plainParts.join('\n').trim() };
}
