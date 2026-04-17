import type { KnowledgeCard, SaveTarget } from '@noteseed/shared-types';

export interface AdapterSaveRequest {
  card: KnowledgeCard;
  markdown: string;
  options?: Record<string, unknown>;
}

export interface AdapterSaveResult {
  success: boolean;
  targetRef?: string;
  targetUrl?: string;
  error?: string;
  savedAt: string;
}

export interface Adapter {
  readonly target: SaveTarget;
  validate(credential: unknown): Promise<boolean>;
  save(req: AdapterSaveRequest): Promise<AdapterSaveResult>;
}
