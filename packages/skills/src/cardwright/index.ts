import type { CardAnalysis, CardwrightOutput, PageType } from '@noteseed/shared-types';

import type { CardwrightRenderMeta } from './meta.js';
import * as conciseTpl from './templates/concise.js';
import * as customTpl from './templates/custom.js';
import * as detailedTpl from './templates/detailed.js';
import * as docTpl from './templates/doc.js';
import * as genericTpl from './templates/generic.js';
import * as newsTpl from './templates/news.js';
import * as opinionTpl from './templates/opinion.js';
import * as tutorialTpl from './templates/tutorial.js';

const MEMOS_MAX_CHARS = 1500;

export interface CardwrightInput {
  analysis: CardAnalysis;
  title: string;
  url: string;
  author?: string;
  publishedAt?: string;
  /** When `memos`, body is truncated to ~1500 characters. */
  target?: string;
  /** User's chosen template style — overrides pageType-based renderer selection. */
  preferredTemplate?: string;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const cjk = trimmed.match(/[\u4e00-\u9fff]/g)?.length ?? 0;
  const latin = trimmed.match(/[a-zA-Z]+(?:'[a-zA-Z]+)?/g)?.length ?? 0;
  return cjk + latin;
}

function isMemosTarget(target?: string): boolean {
  return target?.toLowerCase() === 'memos';
}

function truncateForMemos(markdown: string, plainText: string): { markdown: string; plainText: string } {
  if (plainText.length <= MEMOS_MAX_CHARS) {
    return { markdown, plainText };
  }
  const ellipsis = '…';
  const plainOut = plainText.slice(0, MEMOS_MAX_CHARS - ellipsis.length) + ellipsis;
  const mdOut =
    markdown.length > MEMOS_MAX_CHARS
      ? markdown.slice(0, MEMOS_MAX_CHARS - ellipsis.length) + ellipsis
      : markdown;
  return { markdown: mdOut, plainText: plainOut };
}

function pickRenderer(pageType: PageType, preferredTemplate?: string) {
  if (preferredTemplate) {
    switch (preferredTemplate) {
      case 'concise':
        return conciseTpl.render;
      case 'detailed':
        return detailedTpl.render;
      case 'tutorial':
        return tutorialTpl.render;
      case 'opinion':
        return opinionTpl.render;
      case 'custom':
        return customTpl.render;
    }
  }
  switch (pageType) {
    case 'tutorial':
      return tutorialTpl.render;
    case 'opinion':
      return opinionTpl.render;
    case 'news':
      return newsTpl.render;
    case 'doc':
      return docTpl.render;
    default:
      return genericTpl.render;
  }
}

export async function run(input: CardwrightInput): Promise<CardwrightOutput> {
  const render = pickRenderer(input.analysis.pageType, input.preferredTemplate);
  const meta: CardwrightRenderMeta = {
    target: input.target,
    title: input.title,
    url: input.url,
    author: input.author,
    publishedAt: input.publishedAt,
  };

  let { markdown, plainText } = render(input.analysis, meta);

  if (isMemosTarget(input.target)) {
    ({ markdown, plainText } = truncateForMemos(markdown, plainText));
  }

  const wordCount = countWords(plainText);
  const estimatedMemosLength = plainText.length;

  return {
    markdown,
    plainText,
    wordCount,
    estimatedMemosLength,
  };
}
