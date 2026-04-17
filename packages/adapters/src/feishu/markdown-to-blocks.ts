import type { FeishuBlock } from './client.js';

const HEADING_RE = /^(#{1,9})\s+(.*)$/;
const BULLET_RE = /^[*-]\s+(.*)$/;

function paragraphBlock(content: string): FeishuBlock {
  return {
    block_type: 2,
    text: {
      elements: [{ text_run: { content: content } }],
    },
  };
}

function headingBlock(level: number, text: string): FeishuBlock {
  const lv = Math.min(Math.max(level, 1), 9);
  const blockType = 2 + lv;
  const key = `heading${lv}` as
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'heading4'
    | 'heading5'
    | 'heading6'
    | 'heading7'
    | 'heading8'
    | 'heading9';
  return {
    block_type: blockType,
    [key]: {
      elements: [{ text_run: { content: text } }],
    },
  };
}

function bulletBlock(text: string): FeishuBlock {
  return {
    block_type: 12,
    bullet: {
      elements: [{ text_run: { content: text } }],
    },
  };
}

function codeBlock(content: string): FeishuBlock {
  return {
    block_type: 14,
    code: {
      elements: [{ text_run: { content: content } }],
      style: { language: 1 },
    },
  };
}

/**
 * MVP: heading (#–#######), paragraph, fenced code, unordered list (- or *).
 */
export function markdownToFeishuBlocks(markdown: string): FeishuBlock[] {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  const out: FeishuBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';
    const trimmedEnd = line.trimEnd();
    const trimmed = trimmedEnd.trim();

    if (trimmed.startsWith('```')) {
      const body: string[] = [];
      i++;
      while (i < lines.length) {
        const L = lines[i] ?? '';
        if (L.trim().startsWith('```')) {
          i++;
          break;
        }
        body.push(L);
        i++;
      }
      out.push(codeBlock(body.join('\n')));
      continue;
    }

    if (trimmed === '') {
      i++;
      continue;
    }

    const h = trimmed.match(HEADING_RE);
    if (h?.[1] && h[2] !== undefined) {
      out.push(headingBlock(h[1].length, h[2].trim()));
      i++;
      continue;
    }

    const b = trimmed.match(BULLET_RE);
    if (b?.[1] !== undefined) {
      out.push(bulletBlock(b[1].trim()));
      i++;
      continue;
    }

    const para: string[] = [trimmedEnd];
    i++;
    while (i < lines.length) {
      const L = lines[i] ?? '';
      const t = L.trimEnd();
      const tTrim = t.trim();
      if (tTrim === '') break;
      if (tTrim.startsWith('```')) break;
      if (HEADING_RE.test(tTrim)) break;
      if (BULLET_RE.test(tTrim)) break;
      para.push(t);
      i++;
    }
    out.push(paragraphBlock(para.join('\n')));
  }

  return out.length > 0 ? out : [paragraphBlock('')];
}
