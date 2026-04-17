import type { KnowledgeCard, SaveTarget, SaveTargetResult } from '@noteseed/shared-types';
import { create } from 'zustand';
import { sendMessage } from '@/shared/messaging.js';
import type { Message } from '@/shared/messages.js';

export interface SaveState {
  status: 'idle' | 'saving' | 'success' | 'error';
  targets: SaveTarget[];
  results: SaveTargetResult[];
  error: string | null;
  setTargets: (t: SaveTarget[]) => void;
  save: (card: KnowledgeCard) => Promise<void>;
}

type MessageResponse = Message & { correlationId: string };

export const useSaveStore = create<SaveState>((set, get) => ({
  status: 'idle',
  targets: ['memos'],
  results: [],
  error: null,
  setTargets: (t) => set({ targets: t }),
  save: async (card) => {
    const targets = get().targets;
    if (targets.length === 0) {
      set({ status: 'error', error: 'no_targets', results: [] });
      return;
    }
    set({ status: 'saving', error: null, results: [] });
    try {
      const requestId = crypto.randomUUID();
      const res = (await sendMessage({
        type: 'SAVE_CARD',
        payload: { requestId, card, targets },
      })) as MessageResponse;
      if (res.type === 'SAVE_CARD_RESULT') {
        set({
          status: 'success',
          results: res.payload.results,
          error: null,
        });
        return;
      }
      if (res.type === 'ERROR') {
        set({ status: 'error', results: [], error: res.payload.message });
        return;
      }
      set({ status: 'error', results: [], error: 'unexpected_save_response' });
    } catch (e) {
      set({
        status: 'error',
        results: [],
        error: e instanceof Error ? e.message : 'save_error',
      });
    }
  },
}));
