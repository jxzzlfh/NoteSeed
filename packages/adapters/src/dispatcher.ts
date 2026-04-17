import type {
  SaveRequest,
  SaveResult,
  SaveTarget,
  SaveTargetResult,
} from '@noteseed/shared-types';

import type { Adapter, AdapterSaveRequest } from './types.js';
import { FeishuAdapter } from './feishu/index.js';
import { MemosAdapter } from './memos/index.js';

const registry: Record<string, Adapter> = {
  memos: new MemosAdapter(),
  feishu: new FeishuAdapter(),
};

export async function dispatch(
  req: SaveRequest,
  credentialResolver: (target: string) => Promise<unknown>,
): Promise<SaveResult> {
  const results: SaveTargetResult[] = await Promise.all(
    req.targets.map(async (target) => {
      const savedAt = new Date().toISOString();
      const adapter = registry[target];
      if (!adapter) {
        return {
          target: target as SaveTarget,
          success: false,
          error: `No adapter registered for target: ${target}`,
          savedAt,
        };
      }
      const credential = await credentialResolver(target);
      const saveReq: AdapterSaveRequest = {
        card: req.card,
        markdown: req.card.markdown,
        options: { ...(req.options ?? {}), credential },
      };
      const r = await adapter.save(saveReq);
      return {
        target: target as SaveTarget,
        success: r.success,
        targetRef: r.targetRef,
        targetUrl: r.targetUrl,
        error: r.error,
        savedAt: r.savedAt,
      };
    }),
  );

  return { requestId: req.requestId, results };
}
