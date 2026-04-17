/**
 * Returns trimmed selected text from the active window selection, if any.
 */
export function extractSelectedText(): string | undefined {
  const sel = window.getSelection();
  const text = sel?.toString().trim();
  return text && text.length > 0 ? text : undefined;
}
