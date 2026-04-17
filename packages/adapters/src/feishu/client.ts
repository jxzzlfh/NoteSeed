const TENANT_TOKEN_URL =
  'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';

const CACHE_SAFETY_MS = 60_000;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

type TokenCache = { appId: string; token: string; expiresAt: number };

let tenantTokenCache: TokenCache | undefined;

function formatFeishuError(res: Response, body: string): string {
  if (!body) return res.statusText || `HTTP ${res.status}`;
  try {
    const json = JSON.parse(body) as { msg?: string; message?: string };
    return json.msg ?? json.message ?? body;
  } catch {
    return body;
  }
}

interface TenantTokenResponse {
  code: number;
  msg?: string;
  tenant_access_token?: string;
  expire?: number;
}

export async function getTenantAccessToken(appId: string, appSecret: string): Promise<string> {
  const now = Date.now();
  if (
    tenantTokenCache &&
    tenantTokenCache.appId === appId &&
    tenantTokenCache.expiresAt > now + CACHE_SAFETY_MS
  ) {
    return tenantTokenCache.token;
  }

  const res = await fetch(TENANT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Feishu tenant token HTTP ${res.status}: ${formatFeishuError(res, text)}`);
  }
  const data = JSON.parse(text) as TenantTokenResponse;
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Feishu tenant token failed: ${data.msg ?? text}`);
  }
  const ttlMs = Math.min(
    (data.expire ?? 7200) * 1000,
    TWO_HOURS_MS,
  );
  tenantTokenCache = {
    appId,
    token: data.tenant_access_token,
    expiresAt: now + ttlMs,
  };
  return data.tenant_access_token;
}

interface CreateDocResponse {
  code: number;
  msg?: string;
  data?: {
    document?: {
      document_id?: string;
      revision_id?: number;
    };
  };
}

export async function createDocument(
  accessToken: string,
  title: string,
  folderToken?: string,
): Promise<{ documentId: string; revisionId: number }> {
  const body: Record<string, string> = { title };
  if (folderToken) {
    body.folder_token = folderToken;
  }
  const res = await fetch('https://open.feishu.cn/open-apis/docx/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Feishu createDocument HTTP ${res.status}: ${text}`);
  }
  const json = JSON.parse(text) as CreateDocResponse;
  if (json.code !== 0) {
    throw new Error(`Feishu createDocument: ${json.msg ?? text}`);
  }
  const documentId = json.data?.document?.document_id;
  const revisionId = json.data?.document?.revision_id ?? 1;
  if (!documentId) {
    throw new Error('Feishu createDocument: missing document_id');
  }
  return { documentId, revisionId };
}

export type FeishuBlock = Record<string, unknown>;

interface AppendResponse {
  code: number;
  msg?: string;
}

const MAX_CHILDREN_PER_REQUEST = 50;

/**
 * POST /open-apis/docx/v1/documents/{document_id}/blocks/{block_id}/children
 */
export async function appendBlocks(
  accessToken: string,
  documentId: string,
  parentBlockId: string,
  blocks: FeishuBlock[],
  revisionId: number,
): Promise<void> {
  for (let i = 0; i < blocks.length; i += MAX_CHILDREN_PER_REQUEST) {
    const chunk = blocks.slice(i, i + MAX_CHILDREN_PER_REQUEST);
    const url = new URL(
      `https://open.feishu.cn/open-apis/docx/v1/documents/${encodeURIComponent(documentId)}/blocks/${encodeURIComponent(parentBlockId)}/children`,
    );
    url.searchParams.set('document_revision_id', String(revisionId));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({ children: chunk }),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Feishu appendBlocks HTTP ${res.status}: ${text}`);
    }
    const json = JSON.parse(text) as AppendResponse;
    if (json.code !== 0) {
      throw new Error(`Feishu appendBlocks: ${json.msg ?? text}`);
    }
  }
}
