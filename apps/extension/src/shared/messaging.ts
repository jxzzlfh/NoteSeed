import type { Message } from './messages.js';

/** Outgoing / incoming runtime messages include a correlation id for tracing. */
export type MessageWithCorrelation = Message & { correlationId: string };

function newCorrelationId(): string {
  return crypto.randomUUID();
}

/**
 * Type-safe `chrome.runtime.sendMessage` with a generated `correlationId` on every send.
 */
export function sendMessage<T extends Message>(message: T): Promise<unknown> {
  const correlationId = newCorrelationId();
  const payload: MessageWithCorrelation = { ...message, correlationId };
  return chrome.runtime.sendMessage(payload);
}

export function onMessage(
  handler: (
    message: MessageWithCorrelation,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => boolean | void
): void {
  chrome.runtime.onMessage.addListener(handler);
}
