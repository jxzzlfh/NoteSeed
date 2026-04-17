import type { Message } from '@/shared/messages.js';
import type { MessageWithCorrelation } from '@/shared/messaging.js';
import { apiClient } from '../api-client.js';

export async function handleGenerateCard(
  message: MessageWithCorrelation,
): Promise<Message & { correlationId: string }> {
  if (message.type !== 'GENERATE_CARD') {
    return {
      type: 'ERROR',
      payload: { code: 'INVALID_MESSAGE', message: 'Expected GENERATE_CARD' },
      correlationId: message.correlationId,
    };
  }

  try {
    const card = await apiClient.generateCard(message.payload);
    return {
      type: 'GENERATE_CARD_RESULT',
      payload: card,
      correlationId: message.correlationId,
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const code =
      errMsg === 'RATE_LIMITED'
        ? 'RATE_LIMITED'
        : errMsg === 'UNAUTHORIZED'
          ? 'UNAUTHORIZED'
          : errMsg.includes('fetch') || errMsg.includes('Failed')
            ? 'NETWORK_ERROR'
            : 'GENERATE_FAILED';

    return {
      type: 'ERROR',
      payload: { code, message: errMsg },
      correlationId: message.correlationId,
    };
  }
}
