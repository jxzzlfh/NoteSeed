import type { Message } from '@/shared/messages.js';
import type { MessageWithCorrelation } from '@/shared/messaging.js';
import { abortInFlight } from './api-client.js';
import { handleCapturePage } from './handlers/capture-page.js';
import { handleGenerateCard } from './handlers/generate-card.js';
import { handleSaveCard } from './handlers/save-card.js';

async function dispatchMessage(
  message: MessageWithCorrelation,
  sender: chrome.runtime.MessageSender
): Promise<Message & { correlationId: string }> {
  switch (message.type) {
    case 'CAPTURE_PAGE':
      return handleCapturePage(message, sender);
    case 'GENERATE_CARD':
      return handleGenerateCard(message);
    case 'SAVE_CARD':
      return handleSaveCard(message);
    default:
      return {
        type: 'ERROR',
        payload: {
          code: 'UNHANDLED',
          message: `Unhandled message type: ${(message as Message).type}`,
        },
        correlationId: message.correlationId,
      };
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'sidepanel') {
    port.onDisconnect.addListener(() => {
      abortInFlight();
    });
  }
});

chrome.runtime.onMessage.addListener(
  (
    message: MessageWithCorrelation,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    void dispatchMessage(message, sender)
      .then(sendResponse)
      .catch((e: unknown) => {
        sendResponse({
          type: 'ERROR',
          payload: {
            code: 'INTERNAL',
            message: e instanceof Error ? e.message : String(e),
          },
          correlationId: message.correlationId,
        } satisfies Message & { correlationId: string });
      });
    return true;
  }
);
