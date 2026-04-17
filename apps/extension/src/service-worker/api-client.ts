import type { KnowledgeCard, PageSource, SaveRequest, SaveResult } from '@noteseed/shared-types';
import type { MessageWithCorrelation } from '@/shared/messaging.js';
import { clearAuthToken, getAuthToken } from './auth.js';

const DEFAULT_API_BASE = 'http://localhost:3000';
const STORAGE_API_BASE = 'apiBaseUrl';

let activeController: AbortController | null = null;

export function abortInFlight(): void {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
}

async function getApiBaseUrl(): Promise<string> {
  const row = await chrome.storage.local.get(STORAGE_API_BASE);
  const raw = row[STORAGE_API_BASE];
  if (typeof raw === 'string' && raw.trim().length > 0) {
    return raw.replace(/\/$/, '');
  }
  return DEFAULT_API_BASE;
}

async function notifySessionExpired(): Promise<void> {
  try {
    const msg: MessageWithCorrelation = {
      type: 'ERROR',
      payload: { code: 'UNAUTHORIZED', message: 'Session expired or invalid.' },
      correlationId: crypto.randomUUID(),
    };
    await chrome.runtime.sendMessage(msg);
  } catch {
    /* no listeners */
  }
}

async function request(path: string, init: RequestInit): Promise<Response> {
  const base = await getApiBaseUrl();
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  activeController = controller;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers, signal: controller.signal });
  } catch (e) {
    if (controller.signal.aborted) throw new Error('REQUEST_ABORTED');
    throw e;
  } finally {
    if (activeController === controller) activeController = null;
  }

  if (res.status === 401) {
    await clearAuthToken();
    await notifySessionExpired();
    throw new Error('UNAUTHORIZED');
  }

  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }

  return res;
}

async function parseJsonOrThrow(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (!text) return {};
  return JSON.parse(text) as unknown;
}

export const apiClient = {
  async generateCard(source: PageSource): Promise<KnowledgeCard> {
    const res = await request('/api/v1/cards/generate', {
      method: 'POST',
      body: JSON.stringify({ source }),
    });
    const data = (await parseJsonOrThrow(res)) as { card: KnowledgeCard };
    if (!data.card) {
      throw new Error('Invalid generate response: missing card');
    }
    return data.card;
  },

  async saveCard(body: SaveRequest): Promise<SaveResult> {
    const res = await request('/api/v1/cards/save', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const data = (await parseJsonOrThrow(res)) as SaveResult;
    return data;
  },
};
