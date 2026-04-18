import type { KnowledgeCard, PageSource, SaveRequest, SaveResult } from '@noteseed/shared-types';

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

async function request(path: string, init: RequestInit): Promise<Response> {
  const base = await getApiBaseUrl();
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
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

const SETTINGS_KEY = 'noteseed_settings_v1';

type AIProviderBlob = {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  baseUrl: string;
  fastModel: string;
  powerfulModel: string;
};

type SettingsBlob = {
  aiProvider?: AIProviderBlob;
};

async function readAIProvider(): Promise<
  | {
      provider: 'anthropic' | 'openai';
      apiKey: string;
      baseUrl?: string;
      models: { fast: string; powerful: string };
    }
  | undefined
> {
  const raw = await chrome.storage.local.get(SETTINGS_KEY);
  const settings = raw[SETTINGS_KEY] as SettingsBlob | undefined;
  const ai = settings?.aiProvider;
  if (!ai || !ai.apiKey?.trim() || !ai.fastModel?.trim() || !ai.powerfulModel?.trim()) {
    return undefined;
  }
  return {
    provider: ai.provider,
    apiKey: ai.apiKey.trim(),
    baseUrl: ai.baseUrl?.trim() || undefined,
    models: { fast: ai.fastModel.trim(), powerful: ai.powerfulModel.trim() },
  };
}

export const apiClient = {
  async generateCard(
    source: PageSource,
    opts?: { preferredTemplate?: string; customPrompt?: string },
  ): Promise<KnowledgeCard> {
    const aiProvider = await readAIProvider();
    const options: Record<string, unknown> = {};
    if (aiProvider) options.aiProvider = aiProvider;
    if (opts?.preferredTemplate) options.preferredTemplate = opts.preferredTemplate;
    if (opts?.customPrompt) options.customPrompt = opts.customPrompt;

    const body: Record<string, unknown> = { source };
    if (Object.keys(options).length > 0) body.options = options;

    const res = await request('/api/v1/cards/generate', {
      method: 'POST',
      body: JSON.stringify(body),
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
