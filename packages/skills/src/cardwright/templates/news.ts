import type { CardAnalysis } from '@noteseed/shared-types';

import type { CardwrightRenderMeta } from '../meta.js';

function hashTags(tags: string[]): string {
  return tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t}`))
    .join(' ');
}

export function render(
  analysis: CardAnalysis,
  meta: CardwrightRenderMeta,
): { markdown: string; plainText: string } {
  const title = meta.title?.trim() || '无标题';
  const summary = analysis.summary.trim();
  const www = analysis.fields.whoWhatWhenWhere?.trim();
  const facts = analysis.fields.keyFacts?.filter(Boolean) ?? [];
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const mdParts: string[] = [`## ${title}`, '', '### 摘要', summary, ''];

  if (www) {
    mdParts.push('### 要素（人事时地）', www, '');
  }
  if (facts.length) {
    mdParts.push('### 关键事实', ...facts.map((s) => `- ${s}`), '');
  }

  mdParts.push('---');
  if (meta.url) mdParts.push(`来源: ${meta.url}`);
  if (tags.length) mdParts.push(hashTags(tags));

  const markdown = mdParts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();

  const plainParts: string[] = [title, '', '摘要', summary, ''];
  if (www) {
    plainParts.push('要素（人事时地）', www, '');
  }
  if (facts.length) {
    plainParts.push('关键事实', ...facts.map((s) => `- ${s}`), '');
  }
  plainParts.push('---');
  if (meta.url) plainParts.push(`来源: ${meta.url}`);
  if (tags.length) plainParts.push(hashTags(tags));

  return { markdown, plainText: plainParts.join('\n').trim() };
}
