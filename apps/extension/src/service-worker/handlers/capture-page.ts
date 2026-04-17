import type { Message } from '@/shared/messages.js';
import type { MessageWithCorrelation } from '@/shared/messaging.js';

async function resolveTabId(sender: chrome.runtime.MessageSender): Promise<number | undefined> {
  if (sender.tab?.id !== undefined) return sender.tab.id;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
}

async function ensureContentScript(tabId: number): Promise<void> {
  const manifest = chrome.runtime.getManifest() as chrome.runtime.ManifestV3;
  const file = manifest.content_scripts?.[0]?.js?.[0];
  if (!file) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    });
  } catch {
    /* Restricted pages (e.g. chrome://) or missing host permission */
  }
}

export async function handleCapturePage(
  message: MessageWithCorrelation,
  sender: chrome.runtime.MessageSender
): Promise<Message & { correlationId: string }> {
  if (message.type !== 'CAPTURE_PAGE') {
    return {
      type: 'ERROR',
      payload: { code: 'INVALID_MESSAGE', message: 'Expected CAPTURE_PAGE' },
      correlationId: message.correlationId,
    };
  }

  const tabId = await resolveTabId(sender);
  if (tabId === undefined) {
    return {
      type: 'ERROR',
      payload: { code: 'NO_TAB', message: 'No active tab for capture.' },
      correlationId: message.correlationId,
    };
  }

  try {
    await ensureContentScript(tabId);
    const response = (await chrome.tabs.sendMessage(tabId, message)) as Message & { correlationId: string };
    return response;
  } catch (e) {
    return {
      type: 'ERROR',
      payload: {
        code: 'CAPTURE_FAILED',
        message: e instanceof Error ? e.message : String(e),
      },
      correlationId: message.correlationId,
    };
  }
}
