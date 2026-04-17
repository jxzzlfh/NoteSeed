/**
 * Metadata passed into Cardwright templates from `CardwrightInput`.
 * `target === 'memos'` is interpreted by `cardwright/index.ts` for truncation (~1500 chars).
 */
export type CardwrightRenderMeta = {
  target?: string;
  title?: string;
  url?: string;
  author?: string;
  publishedAt?: string;
};
