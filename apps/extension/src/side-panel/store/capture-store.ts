import type { PageSource } from '@noteseed/shared-types';
import { create } from 'zustand';
import { sendMessage } from '@/shared/messaging.js';
import type { Message } from '@/shared/messages.js';

export interface CaptureState {
  status: 'idle' | 'loading' | 'success' | 'error';
  pageSource: PageSource | null;
  error: string | null;
  capture: () => Promise<void>;
}

type MessageResponse = Message & { correlationId: string };

export const useCaptureStore = create<CaptureState>((set) => ({
  status: 'idle',
  pageSource: null,
  error: null,
  capture: async () => {
    set({ status: 'loading', error: null });
    try {
      const res = (await sendMessage({ type: 'CAPTURE_PAGE' })) as MessageResponse;
      if (res.type === 'CAPTURE_PAGE_RESULT') {
        set({ status: 'success', pageSource: res.payload, error: null });
        return;
      }
      if (res.type === 'ERROR') {
        set({ status: 'error', pageSource: null, error: res.payload.message });
        return;
      }
      set({ status: 'error', pageSource: null, error: 'unexpected_capture_response' });
    } catch (e) {
      set({
        status: 'error',
        pageSource: null,
        error: e instanceof Error ? e.message : 'capture_error',
      });
    }
  },
}));
