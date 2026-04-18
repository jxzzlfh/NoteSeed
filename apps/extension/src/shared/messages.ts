import type { KnowledgeCard, PageSource, SaveRequest, SaveResult } from '@noteseed/shared-types';

export interface GenerateCardPayload {
  source: PageSource;
  preferredTemplate?: string;
  customPrompt?: string;
}

export type Message =
  | { type: 'CAPTURE_PAGE' }
  | { type: 'CAPTURE_PAGE_RESULT'; payload: PageSource }
  | { type: 'GENERATE_CARD'; payload: GenerateCardPayload }
  | { type: 'GENERATE_CARD_RESULT'; payload: KnowledgeCard }
  | { type: 'SAVE_CARD'; payload: SaveRequest }
  | { type: 'SAVE_CARD_RESULT'; payload: SaveResult }
  | { type: 'ERROR'; payload: { code: string; message: string } };
