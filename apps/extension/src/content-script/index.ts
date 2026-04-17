import type { PageSource } from '@noteseed/shared-types';
import type { Message } from '@/shared/messages.js';
import type { MessageWithCorrelation } from '@/shared/messaging.js';
import { extractMainContent } from './extractors/extract-content.js';
import { extractPageMetadata } from './extractors/extract-metadata.js';
import { extractSelectedText } from './extractors/extract-selection.js';

const INIT_KEY = '__NOTESEED_CS_INIT__' as const;

function ensureCleanText(cleanText: string, title: string, url: string): string {
  const t = cleanText.trim();
  if (t.length > 0) return t;
  const fallback = title.trim() || url.trim();
  return fallback.length > 0 ? fallback : ' ';
}

export function buildPageSource(): PageSource {
  const url = window.location.href;
  const { title, cleanText, rawHTML } = extractMainContent(document);
  const metadata = extractPageMetadata(document, url);
  const selectedText = extractSelectedText();
  const collectedAt = new Date().toISOString();

  const finalCleanText = ensureCleanText(cleanText, title, url);
  if (finalCleanText.length < 10 && !selectedText) {
    throw new Error('EMPTY_CONTENT');
  }

  return {
    sourceId: crypto.randomUUID(),
    url,
    title: (title.trim() || document.title.trim() || 'Untitled').trim(),
    rawHTML,
    cleanText: finalCleanText,
    selectedText,
    metadata,
    collectedAt,
  };
}

function isMessageWithCorrelation(x: unknown): x is MessageWithCorrelation {
  return (
    typeof x === 'object' &&
    x !== null &&
    'type' in x &&
    'correlationId' in x &&
    typeof (x as { correlationId: unknown }).correlationId === 'string'
  );
}

const w = globalThis as typeof globalThis & { [INIT_KEY]?: boolean };
if (!w[INIT_KEY]) {
  w[INIT_KEY] = true;

  console.info('[NoteSeed] content script loaded');

  chrome.runtime.onMessage.addListener(
    (
      message: MessageWithCorrelation,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (!isMessageWithCorrelation(message) || message.type !== 'CAPTURE_PAGE') {
        return false;
      }

      void (async () => {
        try {
          const payload = buildPageSource();
          const response: Message & { correlationId: string } = {
            type: 'CAPTURE_PAGE_RESULT',
            payload,
            correlationId: message.correlationId,
          };
          sendResponse(response);
        } catch (e) {
          sendResponse({
            type: 'ERROR',
            payload: {
              code: 'CAPTURE_FAILED',
              message: e instanceof Error ? e.message : String(e),
            },
            correlationId: message.correlationId,
          } satisfies Message & { correlationId: string });
        }
      })();

      return true;
    }
  );
}
