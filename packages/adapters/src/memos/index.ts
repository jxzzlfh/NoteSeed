import type { SaveTarget } from '@noteseed/shared-types';

import type { Adapter, AdapterSaveRequest, AdapterSaveResult } from '../types.js';
import { createMemo, validateToken, type MemosVisibilityApi } from './client.js';
import { isMemosCredential } from './config.js';

const COMPACT_MAX_CHARS = 1500;

function mapVisibility(v: 'private' | 'public' | undefined): MemosVisibilityApi {
  if (v === 'public') return 'PUBLIC';
  return 'PRIVATE';
}

function formatTags(tags: string[]): string {
  if (tags.length === 0) return '';
  const lines = tags
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith('#') ? t : `#${t.replace(/^#+/, '')}`));
  return lines.length > 0 ? `\n\n${lines.join(' ')}` : '';
}

function getMemosOptions(req: AdapterSaveRequest): {
  visibility: 'private' | 'public';
  renderMode: 'compact' | 'full';
} {
  const raw = req.options?.memos;
  if (raw && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const vis = o.visibility === 'public' ? 'public' : 'private';
    const mode = o.renderMode === 'full' ? 'full' : 'compact';
    return { visibility: vis, renderMode: mode };
  }
  return { visibility: 'private', renderMode: 'compact' };
}

function buildBody(markdown: string, tags: string[], renderMode: 'compact' | 'full'): string {
  let body = markdown;
  if (renderMode === 'compact' && body.length > COMPACT_MAX_CHARS) {
    body = `${body.slice(0, COMPACT_MAX_CHARS)}\n\n…`;
  }
  return `${body}${formatTags(tags)}`;
}

function getCredential(req: AdapterSaveRequest): unknown {
  const opts = req.options;
  if (!opts || typeof opts !== 'object') return undefined;
  return (opts as Record<string, unknown>).credential;
}

export class MemosAdapter implements Adapter {
  readonly target: SaveTarget = 'memos';

  async validate(credential: unknown): Promise<boolean> {
    if (!isMemosCredential(credential)) return false;
    const { baseUrl, accessToken } = credential;
    try {
      return await validateToken(baseUrl, accessToken);
    } catch {
      return false;
    }
  }

  async save(req: AdapterSaveRequest): Promise<AdapterSaveResult> {
    const savedAt = new Date().toISOString();
    const cred = getCredential(req);
    if (!isMemosCredential(cred)) {
      return {
        success: false,
        error: 'Invalid Memos credential',
        savedAt,
      };
    }
    const { visibility, renderMode } = getMemosOptions(req);
    const body = buildBody(req.markdown, req.card.analysis.tags, renderMode);
    const vis = mapVisibility(visibility);
    try {
      const created = await createMemo(cred.baseUrl, cred.accessToken, body, vis);
      const id = created.name.replace(/^memos\//, '');
      const base = cred.baseUrl.replace(/\/+$/, '');
      const targetUrl = `${base}/m/${id}`;
      return {
        success: true,
        targetRef: created.name,
        targetUrl,
        savedAt,
      };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        error: message,
        savedAt,
      };
    }
  }
}
