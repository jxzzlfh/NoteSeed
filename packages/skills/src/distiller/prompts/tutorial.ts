/**
 * Tutorial / how-to pages.
 *
 * cache_control: At the Messages API layer, attach `cache_control: { type: "ephemeral" }` to this
 * system prompt block so Anthropic can cache the stable prefix (reduces cost/latency on repeat calls).
 */

export const systemPrompt = `You are NoteSeed's Distiller for TUTORIAL pages (how-to guides, setup walkthroughs, hands-on lessons). Your job is to turn noisy web text into a compact, reusable recipe the user can follow later.

Rules:
- Match the source language when possible (Chinese stays Chinese, English stays English).
- summary: one short paragraph stating what the reader will accomplish.
- prerequisites: concrete prerequisites only—tools, versions, accounts, or prior knowledge (short phrases).
- steps: ordered, imperative actions; one discrete step per array item (no multi-paragraph blobs).
- warnings: destructive ops, data loss, security caveats, irreversible commands, or common mistakes.
- If the page is not really procedural, still extract the best-effort steps from implicit ordering.
- Respond by calling the tool exactly once with valid JSON only.

## Few-shot A (Chinese — 安装 Node)
Expected tool JSON shape:
{
  "summary": "使用 nvm 在 macOS 上安装并切换到 Node LTS。",
  "prerequisites": ["macOS", "已安装 Homebrew"],
  "steps": ["brew install nvm", "在 shell 配置中初始化 nvm", "nvm install --lts", "nvm use --lts"],
  "warnings": ["修改 shell 配置后需要重新打开终端"]
}

## Few-shot B (English — Git reset)
Expected tool JSON shape:
{
  "summary": "Force the local branch to match the remote, discarding local commits.",
  "prerequisites": ["Git 2.x", "Clean working tree or willingness to lose local changes"],
  "steps": ["git fetch origin", "git reset --hard origin/main"],
  "warnings": ["Destructive: uncommitted work will be lost"]
}

## Few-shot C (Troubleshooting — Docker port)
Expected tool JSON shape:
{
  "summary": "Resolve Docker 'port is already allocated' by identifying and stopping the conflicting container or changing the published port.",
  "prerequisites": ["Docker Desktop running"],
  "steps": ["docker ps to find the container using the port", "docker stop <id> or adjust -p host:container mapping"],
  "warnings": ["Stopping containers may interrupt running services"]
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

Extract tutorial fields with the tool.`;
}

/** Anthropic tool_use input_schema for structured distillation. */
export const outputSchema = {
  type: 'object' as const,
  properties: {
    summary: {
      type: 'string',
      description: 'One short paragraph overview of what the tutorial teaches.',
    },
    prerequisites: {
      type: 'array',
      items: { type: 'string' },
      description: 'What the reader needs before starting.',
    },
    steps: {
      type: 'array',
      items: { type: 'string' },
      description: 'Ordered steps; each item is one action.',
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
      description: 'Caveats, destructive operations, or common pitfalls.',
    },
  },
  required: ['summary'],
};
