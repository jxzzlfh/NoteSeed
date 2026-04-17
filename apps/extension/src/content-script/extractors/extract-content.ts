import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

/**
 * Clone the document, sanitize HTML, run Mozilla Readability, and convert article HTML to Markdown.
 * Does not mutate the live page DOM.
 */
export function extractMainContent(originalDoc: Document): {
  title: string;
  cleanText: string;
  rawHTML?: string;
} {
  const clone = originalDoc.cloneNode(true) as Document;
  const rawHtml = clone.documentElement.outerHTML;
  const sanitizedHtml = DOMPurify.sanitize(rawHtml, { WHOLE_DOCUMENT: true });
  const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');

  const article = new Readability(doc).parse();

  if (!article) {
    const title = (originalDoc.title ?? '').trim() || 'Untitled';
    const cleanText = (originalDoc.body?.innerText ?? originalDoc.documentElement?.innerText ?? title).trim();
    return { title, cleanText };
  }

  const title = (article.title ?? '').trim() || (originalDoc.title ?? '').trim() || 'Untitled';
  const rawHTML = article.content
    ? DOMPurify.sanitize(article.content, { WHOLE_DOCUMENT: false })
    : undefined;

  let cleanText = '';
  if (article.content) {
    cleanText = turndown.turndown(article.content).trim();
  }
  if (!cleanText) {
    cleanText = (article.textContent ?? '').trim();
  }

  return {
    title,
    cleanText,
    rawHTML,
  };
}
