import type { Message } from '@/shared/messages.js';
import type { MessageWithCorrelation } from '@/shared/messaging.js';
import { db } from '@/shared/db.js';
import { apiClient } from '../api-client.js';

export async function handleSaveCard(
  message: MessageWithCorrelation,
): Promise<Message & { correlationId: string }> {
  if (message.type !== 'SAVE_CARD') {
    return {
      type: 'ERROR',
      payload: { code: 'INVALID_MESSAGE', message: 'Expected SAVE_CARD' },
      correlationId: message.correlationId,
    };
  }

  try {
    const result = await apiClient.saveCard(message.payload);
    await db.saveCard(message.payload.card);
    return {
      type: 'SAVE_CARD_RESULT',
      payload: result,
      correlationId: message.correlationId,
    };
  } catch (e) {
    await db.saveCard(message.payload.card).catch(() => {});

    const errMsg = e instanceof Error ? e.message : String(e);
    const code =
      errMsg === 'RATE_LIMITED'
        ? 'RATE_LIMITED'
        : errMsg === 'UNAUTHORIZED'
          ? 'UNAUTHORIZED'
          : errMsg.includes('fetch') || errMsg.includes('Failed')
            ? 'NETWORK_ERROR'
            : 'SAVE_FAILED';

    return {
      type: 'ERROR',
      payload: { code, message: errMsg },
      correlationId: message.correlationId,
    };
  }
}
