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
 * Custom template — renders ONLY the LLM's response to the user's custom prompt.
 * No extra sections (keyPoints, actionItems, quotes) — just summary + source + tags.
 */
export function render(
  analysis: CardAnalysis,
  meta: CardwrightRenderMeta,
): { markdown: string; plainText: string } {
  const title = meta.title?.trim() || '无标题';
  const summary = analysis.summary.trim();
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const mdParts: string[] = [`## ${title}`, '', summary, ''];

  mdParts.push('---');
  if (meta.url) mdParts.push(`来源: ${meta.url}`);
  if (tags.length) mdParts.push(hashTags(tags));

  const markdown = mdParts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd();

  const plainParts: string[] = [title, '', summary, ''];
  plainParts.push('---');
  if (meta.url) plainParts.push(`来源: ${meta.url}`);
  if (tags.length) plainParts.push(hashTags(tags));

  return { markdown, plainText: plainParts.join('\n').trim() };
}
