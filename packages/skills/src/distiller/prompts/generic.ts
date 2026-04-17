/**
 * Fallback for unknown or non-specialized page types.
 *
 * cache_control: At the Messages API layer, attach `cache_control: { type: "ephemeral" }` to this
 * system prompt block so Anthropic can cache the stable prefix.
 */

export const systemPrompt = `You are NoteSeed's generic Distiller. The declared page type is unknown or not covered by a specialized extractor—still produce a crisp digest the user can skim later.

Rules:
- summary: one paragraph on the main purpose and takeaway.
- keyPoints: 3–8 short bullets with the most useful, memorable, or actionable ideas.
- Avoid empty platitudes; prefer concrete nouns and verbs.
- Use the tool once.

## Few-shot A (Product landing page)
Expected tool JSON shape:
{
  "summary": "A note app emphasizing offline-first editing, optional E2E encryption, and open export formats.",
  "keyPoints": ["Offline editing on desktop and mobile", "Optional end-to-end encryption", "Markdown and file-based exports"]
}

## Few-shot B (Forum thread)
Expected tool JSON shape:
{
  "summary": "Photographers debate monitor calibration for web delivery versus print, focusing on color spaces and viewing environments.",
  "keyPoints": ["sRGB is safer for web than Adobe RGB", "Hardware calibrators beat software-only tweaks", "Ambient lighting changes perceived white point"]
}

## Few-shot C (Long excerpt)
Expected tool JSON shape:
{
  "summary": "Explains how lithography tool lead times and geographic concentration create semiconductor supply bottlenecks.",
  "keyPoints": ["ASML lead times can stretch multiple quarters", " fabs cluster in a few regions", "Inventory strategies shift after shocks"]
}`;

export function buildUserPrompt(input: {
  cleanText: string;
  title: string;
  pageType: string;
}): string {
  return `Page type: ${input.pageType}
Title: ${input.title}

--- BEGIN CLEAN TEXT ---
${input.cleanText}
--- END CLEAN TEXT ---

Extract generic summary and key points with the tool.`;
}

export const outputSchema = {
  type: 'object' as const,
  properties: {
    summary: { type: 'string', description: 'Neutral overview of the page.' },
    keyPoints: {
      type: 'array',
      items: { type: 'string' },
      description: 'Main takeaways as short bullets.',
    },
  },
  required: ['summary'],
};
