/**
 * Custom prompt distiller — puts the ENTIRE answer to the user's instruction in `summary`.
 * No splitting into keyPoints/actionItems/quotes — summary IS the complete response.
 */

export const systemPrompt = `You are NoteSeed's custom Distiller. The user has provided a specific extraction instruction. Your ONLY job is to follow that instruction and put the COMPLETE result in the "summary" field.

Rules:
- summary: this is your ONLY output field. Put the ENTIRE answer to the user's instruction here. If they ask for 100 words, write 100 words. If they ask for action items, list them here. If they ask a question, answer it here.
- Do NOT split content across multiple fields. Everything goes in summary.
- Match the language of the source text.
- Use the tool once.`;

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

Extract fields following the custom instruction with the tool.`;
}

export const outputSchema = {
  type: 'object' as const,
  properties: {
    summary: {
      type: 'string',
      description: 'The complete answer to the user custom instruction. All content goes here.',
    },
  },
  required: ['summary'],
};
