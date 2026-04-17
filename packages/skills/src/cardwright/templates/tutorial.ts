import type { CardAnalysis } from '@noteseed/shared-types';

import type { CardwrightRenderMeta } from '../meta.js';

/**
 * Pure template — no LLM. Omit sections when the underlying fields are empty.
 */
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

  const mdParts: string[] = [`# ${title}`, '', '## 摘要', summary, ''];

  if (pre.length) {
    mdParts.push('## 前置条件', ...pre.map((s) => `- ${s}`), '');
  }
  if (steps.length) {
    const numbered = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    mdParts.push('## 步骤', numbered, '');
  }
  if (warnings.length) {
    mdParts.push('## 注意事项', ...warnings.map((s) => `- ${s}`), '');
  }

  const footerBits: string[] = [];
  if (meta.url) footerBits.push(`来源: ${meta.url}`);
  if (meta.author) footerBits.push(meta.author);
  if (meta.publishedAt) footerBits.push(meta.publishedAt);
  const footerLine = footerBits.join(' · ');
  mdParts.push('---');
  if (footerLine) mdParts.push(footerLine);
  if (tags.length) mdParts.push(`标签: ${tags.join(' · ')}`);

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
  if (footerLine) plainParts.push(footerLine);
  if (tags.length) plainParts.push(`标签: ${tags.join(' · ')}`);

  const plainText = plainParts.join('\n').trim();

  return { markdown, plainText };
}
