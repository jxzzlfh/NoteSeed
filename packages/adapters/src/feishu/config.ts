export interface FeishuCredential {
  appId: string;
  appSecret: string;
  folderToken?: string;
}

export function isFeishuCredential(value: unknown): value is FeishuCredential {
  if (value === null || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.appId === 'string' && typeof v.appSecret === 'string';
}
