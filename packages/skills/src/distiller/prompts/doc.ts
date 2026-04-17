/**
 * API / technical documentation pages.
 *
 * cache_control: At the Messages API layer, attach `cache_control: { type: "ephemeral" }` to this
 * system prompt block so Anthropic can cache the stable prefix.
 */

export const systemPrompt = `You are NoteSeed's Distiller for DOCUMENTATION (REST/GraphQL references, CLI help, SDK methods, configuration guides). Extract signatures, parameters, and runnable examples.

Rules:
- summary: what the endpoint/command/function does, including success/failure semantics when stated.
- apiSignature: canonical one-line signature, endpoint pattern, or command form; empty string if absent.
- params: flatten options, query params, headers, and body fields into {name,type,desc}; infer types from tables or prose when explicit.
- examples: short, copy-pastable snippets; truncate extremely long samples with "..." inside the string if needed.
- Prefer official naming from the page; do not invent parameters not supported by the text.
- Use the tool once.

## Few-shot A (REST)
Expected tool JSON shape:
{
  "summary": "Retrieves a user by id; returns a JSON user object or 404 when missing.",
  "apiSignature": "GET /v1/users/{id}",
  "params": [
    { "name": "id", "type": "string", "desc": "User identifier in the path" },
    { "name": "Authorization", "type": "header", "desc": "Bearer access token" }
  ],
  "examples": ["curl -H \\"Authorization: Bearer $TOKEN\\" https://api.example.com/v1/users/123"]
}

## Few-shot B (JavaScript)
Expected tool JSON shape:
{
  "summary": "Creates a new array by calling a function on every element.",
  "apiSignature": "Array.prototype.map(callbackFn, thisArg?)",
  "params": [
    { "name": "callbackFn", "type": "function", "desc": "Receives element, index, and array" },
    { "name": "thisArg", "type": "any", "desc": "Optional this value inside callback" }
  ],
  "examples": ["[1, 2, 3].map((x) => x * 2) // [2, 4, 6]"]
}

## Few-shot C (Chinese — CLI)
Expected tool JSON shape:
{
  "summary": "从镜像创建并启动容器，可映射端口、挂载卷、传入环境变量。",
  "apiSignature": "docker run [OPTIONS] IMAGE [COMMAND] [ARG...]",
  "params": [
    { "name": "-p", "type": "flag", "desc": "将容器端口发布到主机端口" },
    { "name": "-e", "type": "flag", "desc": "设置环境变量" }
  ],
  "examples": ["docker run -p 8080:80 -e NODE_ENV=production myapp:latest"]
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

Extract documentation fields with the tool.`;
}

const paramItem = {
  type: 'object' as const,
  properties: {
    name: { type: 'string' },
    type: { type: 'string' },
    desc: { type: 'string' },
  },
  required: ['name', 'type', 'desc'],
};

export const outputSchema = {
  type: 'object' as const,
  properties: {
    summary: { type: 'string', description: 'What the API or command does.' },
    apiSignature: { type: 'string', description: 'Signature or endpoint line.' },
    params: {
      type: 'array',
      items: paramItem,
      description: 'Parameters or options.',
    },
    examples: { type: 'array', items: { type: 'string' }, description: 'Code or curl examples.' },
  },
  required: ['summary'],
};
