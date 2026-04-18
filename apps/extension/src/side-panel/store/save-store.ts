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
        const results = res.payload.results as SaveTargetResult[];
        const failed = results.filter((r) => !r.success);
        if (failed.length === 0) {
          set({ status: 'success', results, error: null });
        } else {
          set({
            status: 'error',
            results,
            error: failed.map((r) => `${r.target}: ${r.error ?? '未知错误'}`).join('; '),
          });
        }
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
