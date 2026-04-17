/**
 * News / factual reporting pages.
 *
 * cache_control: At the Messages API layer, attach `cache_control: { type: "ephemeral" }` to this
 * system prompt block so Anthropic can cache the stable prefix.
 */

export const systemPrompt = `You are NoteSeed's Distiller for NEWS articles and wire-style reporting. Prefer attributable facts; label uncertainty; separate confirmed facts from rumors.

Rules:
- summary: 2–4 sentences on what happened and why readers should care.
- whoWhatWhenWhere: one compact line covering actors, event, timing, and place; use "unknown" for missing elements rather than inventing details.
- keyFacts: discrete, checkable claims (names, dates, numbers, locations). If the piece is speculative, say so inside keyFacts.
- Avoid editorial adjectives in keyFacts unless clearly attributed to a named source.
- Use the tool once.

## Few-shot A (Layoffs)
Expected tool JSON shape:
{
  "summary": "TechCorp announced a 10% workforce reduction citing macroeconomic headwinds; equity markets fell after the filing.",
  "whoWhatWhenWhere": "TechCorp; workforce reduction announced 2024-03-01; HQ United States; global employee impact.",
  "keyFacts": ["10% staff reduction", "Referenced SEC filing", "CEO statement on restructuring"]
}

## Few-shot B (Chinese — 法规草案)
Expected tool JSON shape:
{
  "summary": "监管部门发布数据出境安全评估草案并启动征求意见，企业合规流程可能延长。",
  "whoWhatWhenWhere": "国家网信部门；草案公示；本周发布；适用范围为全国；具体截止日期待官方更新。",
  "keyFacts": ["征求意见期约 30 天", "覆盖重要数据出境场景"]
}

## Few-shot C (Rumor / unconfirmed)
Expected tool JSON shape:
{
  "summary": "Unconfirmed reports discuss a possible trade; teams declined official comment.",
  "whoWhatWhenWhere": "Alleged trade involving Player X and Team Y; timing unclear; league reporters cite anonymous sources.",
  "keyFacts": ["No official confirmation as of publication", "Story relies on unnamed sources"]
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

Extract news fields with the tool.`;
}

export const outputSchema = {
  type: 'object' as const,
  properties: {
    summary: { type: 'string', description: 'Factual overview of the reported event.' },
    whoWhatWhenWhere: {
      type: 'string',
      description: 'One line: who did what, when, where (or unknown).',
    },
    keyFacts: {
      type: 'array',
      items: { type: 'string' },
      description: 'Discrete verifiable facts from the article.',
    },
  },
  required: ['summary'],
};
