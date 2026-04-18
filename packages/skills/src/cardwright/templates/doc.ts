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
  const sig = analysis.fields.apiSignature?.trim();
  const params = analysis.fields.params?.filter((p) => p.name?.trim()) ?? [];
  const examples = analysis.fields.examples?.filter(Boolean) ?? [];
  const tags = analysis.tags?.filter(Boolean) ?? [];

  const mdParts: string[] = [`## ${title}`, '', '### 摘要', summary, ''];

  if (sig) {
    mdParts.push('### 签名 / 端点', '', '```', sig, '```', '');
  }
  if (params.length) {
    const rows = params.map((p) => `| ${p.name} | ${p.type} | ${p.desc} |`);
    mdParts.push(
      '### 参数',
      '',
      '| 名称 | 类型 | 说明 |',
      '| --- | --- | --- |',
      ...rows,
      '',
    );
  }
  if (examples.length) {
    mdParts.push('### 示例');
    for (const ex of examples) {
      mdParts.push('', '```', ex, '```');
    }
    mdParts.push('');
  }

  mdParts.push('---');
  if (meta.url) mdParts.push(`来源: ${meta.url}`);
  if (tags.length) mdParts.push(hashTags(tags));

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
  if (meta.url) plainParts.push(`来源: ${meta.url}`);
  if (tags.length) plainParts.push(hashTags(tags));

  return { markdown, plainText: plainParts.join('\n').trim() };
}
