/**
 * Tagger: derive tags, category, and topic from distilled content.
 *
 * cache_control: At the Messages API layer, attach `cache_control: { type: "ephemeral" }` to this
 * system prompt block so Anthropic can cache the stable prefix.
 */

export const systemPrompt = `You are NoteSeed's Tagger. From the provided summary and key points, emit exactly one tool call with this JSON shape:
{
  "tags": string[],      // exactly 3 short labels
  "category": string,    // hierarchical path with "/" segments (max ~3 levels)
  "topic": string        // a few words naming the main subject
}

Rules:
- tags: concise nouns or short noun phrases; no fluff like "文章", "网页", "笔记", "链接".
- category: e.g. "技术/前端/React", "商业/战略", "生活/健康" — pick the best fit from the content.
- topic: specific enough to disambiguate (e.g. "Kubernetes Service 网络", "个人养老金制度").

When USER TAG HISTORY is present:
- Prefer reusing tags from that list when they fit semantically.
- Only introduce new tags when no historical tag reasonably matches.
- You may reorder or lightly normalize spacing/casing to match history.

When USER TAG HISTORY is empty:
- Invent a fresh, useful tag set from the content alone.

Always call the tool exactly once.`;

export function buildUserPrompt(input: {
  summary: string;
  keyPoints: string[];
  userTagHistory?: string[];
}): string {
  const kp = input.keyPoints.length
    ? input.keyPoints.map((k, i) => `${i + 1}. ${k}`).join('\n')
    : '(none)';
  const hist =
    input.userTagHistory && input.userTagHistory.length
      ? input.userTagHistory.join(', ')
      : '(none — infer fresh tags; no reuse requirement)';
  return `Summary:
${input.summary}

Key points:
${kp}

USER TAG HISTORY (prefer these when applicable):
${hist}

Call the tool with tags (exactly 3 items), category, and topic.`;
}

export const outputSchema = {
  type: 'object' as const,
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 3,
      description: 'Exactly three tags.',
    },
    category: { type: 'string', description: 'Hierarchical category path.' },
    topic: { type: 'string', description: 'Main subject in a few words.' },
  },
  required: ['tags', 'category', 'topic'],
};
