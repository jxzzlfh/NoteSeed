import type { CardAnalysis } from '@noteseed/shared-types';

import type { CardwrightRenderMeta } from '../meta.js';

export function render(
  analysis: CardAnalysis,
  meta: CardwrightRenderMeta,
): { markdown: string; plainText: string } {
  const title = meta.title?.trim() || '无标题';
  const summary = analysis.summary.trim();
  const sig = analysis.fields.apiSignature?.trim();
  const params = analysis.fields.params?.filter((p) => p.name?.trim()) ?? [];
  const examples = analysis.fields.examples?.filter(Boolean) ?? [];
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const mdParts: string[] = [`# ${title}`, '', '## 摘要', summary, ''];

  if (sig) {
    mdParts.push('## 签名 / 端点', '', '```', sig, '```', '');
  }
  if (params.length) {
    const rows = params.map((p) => `| ${p.name} | ${p.type} | ${p.desc} |`);
    mdParts.push(
      '## 参数',
      '',
      '| 名称 | 类型 | 说明 |',
      '| --- | --- | --- |',
      ...rows,
      '',
    );
  }
  if (examples.length) {
    mdParts.push('## 示例');
    for (const ex of examples) {
      mdParts.push('', '```', ex, '```');
    }
    mdParts.push('');
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
  if (sig) {
    plainParts.push('签名 / 端点', sig, '');
  }
  if (params.length) {
    plainParts.push(
      '参数',
      ...params.map((p) => `- ${p.name} (${p.type}): ${p.desc}`),
      '',
    );
  }
  if (examples.length) {
    plainParts.push('示例', ...examples, '');
  }
  plainParts.push('---');
  if (footerLine) plainParts.push(footerLine);
  if (tags.length) plainParts.push(`标签: ${tags.join(' · ')}`);

  return { markdown, plainText: plainParts.join('\n').trim() };
}
