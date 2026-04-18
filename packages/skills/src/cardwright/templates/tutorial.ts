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
  const pre = analysis.fields.prerequisites?.filter(Boolean) ?? [];
  const steps = analysis.fields.steps?.filter(Boolean) ?? [];
  const warnings = analysis.fields.warnings?.filter(Boolean) ?? [];
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const mdParts: string[] = [`## ${title}`, '', '### 摘要', summary, ''];

  if (pre.length) {
    mdParts.push('### 前置条件', ...pre.map((s) => `- ${s}`), '');
  }
  if (steps.length) {
    const numbered = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    mdParts.push('### 步骤', numbered, '');
  }
  if (warnings.length) {
    mdParts.push('### 注意事项', ...warnings.map((s) => `- ${s}`), '');
  }

  mdParts.push('---');
  if (meta.url) mdParts.push(`来源: ${meta.url}`);
  if (tags.length) mdParts.push(hashTags(tags));

  const markdown = mdParts
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

  const plainParts: string[] = [title, '', '摘要', summary, ''];
  if (pre.length) {
    plainParts.push('前置条件', ...pre.map((s) => `- ${s}`), '');
  }
  if (steps.length) {
    plainParts.push('步骤', ...steps.map((s, i) => `${i + 1}. ${s}`), '');
  }
  if (warnings.length) {
    plainParts.push('注意事项', ...warnings.map((s) => `- ${s}`), '');
  }
  plainParts.push('---');
  if (meta.url) plainParts.push(`来源: ${meta.url}`);
  if (tags.length) plainParts.push(hashTags(tags));

  const plainText = plainParts.join('\n').trim();

  return { markdown, plainText };
}
