export type MemosVisibilityApi = 'PRIVATE' | 'PROTECTED' | 'PUBLIC';

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

async function readErrorBody(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || `HTTP ${res.status}`;
  try {
    const json = JSON.parse(text) as { message?: string; msg?: string };
    return json.message ?? json.msg ?? text;
  } catch {
    return text;
  }
}

/**
 * POST /api/v1/memos (Memos v0.22+)
 */
export async function createMemo(
  baseUrl: string,
  token: string,
  content: string,
  visibility: MemosVisibilityApi,
): Promise<{ name: string }> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/memos`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ content, visibility }),
  });
  if (!res.ok) {
    throw new Error(`Memos createMemo failed: ${res.status} ${await readErrorBody(res)}`);
  }
  const data = (await res.json()) as { name?: string };
  if (!data.name) {
    throw new Error('Memos createMemo: missing name in response');
  }
  return { name: data.name };
}

/**
 * GET /api/v1/users/me — validates token
 */
export async function validateToken(baseUrl: string, token: string): Promise<boolean> {
  const url = `${normalizeBaseUrl(baseUrl)}/api/v1/users/me`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  return res.ok;
}
