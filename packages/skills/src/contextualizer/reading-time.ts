const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufadf]/g;

/**
 * Estimates reading time using CJK vs Latin heuristics:
 * — If CJK ratio ≥ 0.5 → Chinese reading speed (~300 characters per minute).
 * — Otherwise → English reading speed (~200 words per minute).
 */
export function estimateReadingTime(text: string): string {
  const t = text.trim();
  if (t.length === 0) {
    return '0 min';
  }

  const cjkMatches = t.match(CJK_RE);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const nonWhitespace = t.replace(/\s+/g, '');
  const denom = Math.max(nonWhitespace.length, 1);
  const cjkRatio = cjkCount / denom;

  let minutes: number;
  if (cjkRatio >= 0.5) {
    minutes = t.length / 300;
  } else {
    const words = t.split(/\s+/).filter((w) => w.length > 0).length;
    minutes = words / 200;
  }

  if (minutes <= 0) {
    return '0 min';
  }
  if (minutes < 1 / 6) {
    return '< 1 min';
  }

  const rounded = Math.max(1, Math.ceil(minutes));
  return `${rounded} min`;
}

/**
 * Simple BCP-47–style label from CJK density (for contextualizer output).
 */
export function detectLanguageLabel(text: string): string {
  const t = text.trim();
  if (t.length === 0) {
    return 'und';
  }
  const cjkMatches = t.match(CJK_RE);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const nonWhitespace = t.replace(/\s+/g, '');
  const denom = Math.max(nonWhitespace.length, 1);
  return cjkCount / denom >= 0.15 ? 'zh' : 'en';
}
