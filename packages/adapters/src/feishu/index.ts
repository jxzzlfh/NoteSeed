import type { SaveTarget } from '@noteseed/shared-types';

import type { Adapter, AdapterSaveRequest, AdapterSaveResult } from '../types.js';
import { appendBlocks, createDocument, getTenantAccessToken } from './client.js';
import { isFeishuCredential } from './config.js';
import { markdownToFeishuBlocks } from './markdown-to-blocks.js';

function getCredential(req: AdapterSaveRequest): unknown {
  const opts = req.options;
  if (!opts || typeof opts !== 'object') return undefined;
  return (opts as Record<string, unknown>).credential;
}

function getFolderToken(req: AdapterSaveRequest, cred: {
  folderToken?: string;
}): string | undefined {
  const raw = req.options?.feishu;
  if (raw && typeof raw === 'object') {
    const ft = (raw as Record<string, unknown>).folderToken;
    if (typeof ft === 'string' && ft.length > 0) return ft;
  }
  return cred.folderToken;
}

function docTitle(req: AdapterSaveRequest): string {
  const t = req.card.source.title?.trim();
  if (t) return t.slice(0, 800);
  const firstLine = req.markdown.split(/\r?\n/).find((l) => l.trim().length > 0);
  if (firstLine) return firstLine.trim().slice(0, 800);
  return 'NoteSeed';
}

export class FeishuAdapter implements Adapter {
  readonly target = 'feishu' as SaveTarget;

  async validate(credential: unknown): Promise<boolean> {
    if (!isFeishuCredential(credential)) return false;
    try {
      await getTenantAccessToken(credential.appId, credential.appSecret);
      return true;
    } catch {
      return false;
    }
  }

  async save(req: AdapterSaveRequest): Promise<AdapterSaveResult> {
    const savedAt = new Date().toISOString();
    const cred = getCredential(req);
    if (!isFeishuCredential(cred)) {
      return {
        success: false,
        error: 'Invalid Feishu credential',
        savedAt,
      };
    }

    try {
      const token = await getTenantAccessToken(cred.appId, cred.appSecret);
      const folder = getFolderToken(req, cred);
      const { documentId, revisionId } = await createDocument(
        token,
        docTitle(req),
        folder,
      );
      const blocks = markdownToFeishuBlocks(req.markdown);
      await appendBlocks(token, documentId, documentId, blocks, revisionId);
      const targetUrl = `https://feishu.cn/docx/${documentId}`;
      return {
        success: true,
        targetRef: documentId,
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
