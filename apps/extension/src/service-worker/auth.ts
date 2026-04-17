const TOKEN_KEY = 'authToken';

export async function getAuthToken(): Promise<string | undefined> {
  const row = await chrome.storage.local.get(TOKEN_KEY);
  const token = row[TOKEN_KEY];
  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

export async function setAuthToken(token: string): Promise<void> {
  await chrome.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const segment = parts[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = atob(padded);
    return JSON.parse(json) as { exp?: number };
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (payload?.exp === undefined) return true;
  return payload.exp * 1000 > Date.now();
}
