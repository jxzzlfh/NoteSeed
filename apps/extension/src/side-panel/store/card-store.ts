import type { KnowledgeCard, PageSource, PageType } from '@noteseed/shared-types';
import { create } from 'zustand';
import { sendMessage } from '@/shared/messaging.js';
import type { Message } from '@/shared/messages.js';

export type PipelineStageKey = 'pageSense' | 'distiller' | 'cardwright';

export type PipelineStageStatus = 'idle' | 'running' | 'done' | 'failed';

export interface CardState {
  status: 'idle' | 'generating' | 'ready' | 'error';
  card: KnowledgeCard | null;
  pageType: PageType | null;
  markdown: string;
  error: string | null;
  selectedTemplate: string;
  pipeline: Record<PipelineStageKey, PipelineStageStatus>;
  generate: (source: PageSource) => Promise<void>;
  updateMarkdown: (md: string) => void;
  updateTags: (tags: string[]) => void;
  updateTitle: (title: string) => void;
  setSelectedTemplate: (id: string) => void;
  resetPipeline: () => void;
}

type MessageResponse = Message & { correlationId: string };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function initialPipeline(): Record<PipelineStageKey, PipelineStageStatus> {
  return { pageSense: 'idle', distiller: 'idle', cardwright: 'idle' };
}

function rewriteMarkdownTitle(markdown: string, title: string): string {
  const lines = markdown.split('\n');
  const first = lines[0]?.trim() ?? '';
  if (/^#\s+/.test(first)) {
    lines[0] = `# ${title}`;
    return lines.join('\n');
  }
  return `# ${title}\n\n${markdown}`;
}

export const useCardStore = create<CardState>((set, get) => ({
  status: 'idle',
  card: null,
  pageType: null,
  markdown: '',
  error: null,
  selectedTemplate: 'balanced',
  pipeline: initialPipeline(),
  resetPipeline: () => set({ pipeline: initialPipeline() }),
  setSelectedTemplate: (id) => set({ selectedTemplate: id }),
  generate: async (source) => {
    set({
      status: 'generating',
      error: null,
      card: null,
      pageType: null,
      markdown: '',
      pipeline: { pageSense: 'running', distiller: 'idle', cardwright: 'idle' },
    });
    try {
      await delay(350);
      set({
        pipeline: { pageSense: 'done', distiller: 'running', cardwright: 'idle' },
      });
      await delay(350);
      set({
        pipeline: { pageSense: 'done', distiller: 'done', cardwright: 'running' },
      });
      const res = (await sendMessage({
        type: 'GENERATE_CARD',
        payload: source,
      })) as MessageResponse;
      if (res.type === 'GENERATE_CARD_RESULT') {
        const tpl = get().selectedTemplate;
        const card: KnowledgeCard = {
          ...res.payload,
          analysis: { ...res.payload.analysis, suggestedTemplate: tpl },
        };
        set({
          status: 'ready',
          card,
          pageType: card.analysis.pageType,
          markdown: card.markdown,
          error: null,
          pipeline: { pageSense: 'done', distiller: 'done', cardwright: 'done' },
        });
        return;
      }
      if (res.type === 'ERROR') {
        set({
          status: 'error',
          card: null,
          pageType: null,
          markdown: '',
          error: res.payload.message,
          pipeline: { pageSense: 'done', distiller: 'done', cardwright: 'failed' },
        });
        return;
      }
      set({
        status: 'error',
        card: null,
        pageType: null,
        markdown: '',
        error: 'unexpected_generate_response',
        pipeline: { pageSense: 'done', distiller: 'done', cardwright: 'failed' },
      });
    } catch (e) {
      set({
        status: 'error',
        card: null,
        pageType: null,
        markdown: '',
        error: e instanceof Error ? e.message : 'generate_error',
        pipeline: { pageSense: 'done', distiller: 'done', cardwright: 'failed' },
      });
    }
  },
  updateMarkdown: (md) =>
    set((s) => {
      const now = new Date().toISOString();
      const nextCard =
        s.card != null
          ? { ...s.card, markdown: md, updatedAt: now, plainText: md.replace(/[#>*`_]/g, ' ') }
          : null;
      return { markdown: md, card: nextCard };
    }),
  updateTags: (tags) =>
    set((s) => {
      if (!s.card) return {};
      const now = new Date().toISOString();
      return {
        card: {
          ...s.card,
          analysis: { ...s.card.analysis, tags },
          updatedAt: now,
        },
      };
    }),
  updateTitle: (title) =>
    set((s) => {
      if (!s.card) return {};
      const now = new Date().toISOString();
      const md = rewriteMarkdownTitle(s.markdown || s.card.markdown, title);
      return {
        card: {
          ...s.card,
          source: { ...s.card.source, title },
          markdown: md,
          updatedAt: now,
        },
        markdown: md,
      };
    }),
}));
