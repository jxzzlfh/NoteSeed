export interface MemosCredential {
  baseUrl: string;
  accessToken: string;
}

export function isMemosCredential(value: unknown): value is MemosCredential {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.baseUrl === 'string' && typeof v.accessToken === 'string';
}
