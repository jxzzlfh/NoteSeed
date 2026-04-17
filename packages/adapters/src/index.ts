/**
 * @noteseed/adapters
 * Adapter layer — connects KnowledgeCards to external note systems.
 */

export type { Adapter, AdapterSaveRequest, AdapterSaveResult } from './types.js';
export { dispatch } from './dispatcher.js';
export { MemosAdapter } from './memos/index.js';
export { FeishuAdapter } from './feishu/index.js';
