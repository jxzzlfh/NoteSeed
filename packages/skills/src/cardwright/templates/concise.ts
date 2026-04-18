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
 * Concise template — ultra-compact card.
 * One-line takeaway as blockquote + max 3 tight bullets.
 */
export function render(
  analysis: CardAnalysis,
  meta: CardwrightRenderMeta,
): { markdown: string; plainText: string } {
  const title = meta.title?.trim() || '无标题';
  const summary = analysis.summary.trim();
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const allPoints = [
    ...(analysis.fields.keyPoints ?? []),
    ...(analysis.fields.keyFacts ?? []),
    ...(analysis.fields.steps ?? []),
  ].filter(Boolean);
  const topPoints = allPoints.slice(0, 3);

  const mdParts: string[] = [
    `## ${title}`,
    '',
    `> ${(summary.split(/[。.！!？?]/)[0] ?? summary).trim()}`,
    '',
  ];

  if (topPoints.length) {
    mdParts.push(...topPoints.map((s) => `- ${s}`), '');
  }

  mdParts.push('---');
  if (meta.url) mdParts.push(`来源: ${meta.url}`);
  if (tags.length) mdParts.push(hashTags(tags));

  const markdown = mdParts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();

  const plainParts: string[] = [title, '', (summary.split(/[。.]/)[0] ?? summary).trim(), ''];
  if (topPoints.length) plainParts.push(...topPoints.map((s) => `- ${s}`), '');
  plainParts.push('---');
  if (meta.url) plainParts.push(`来源: ${meta.url}`);
  if (tags.length) plainParts.push(hashTags(tags));

  return { markdown, plainText: plainParts.join('\n').trim() };
}
