# NoteSeed 架构文档

## 系统概览

NoteSeed 是一款 Chrome 浏览器扩展，通过 AI Skills 管线将网页内容转化为结构化知识卡片，并分发到 Memos、飞书等第三方笔记系统。

```
┌────────────────────────────┐
│   Chrome Extension (MV3)   │
│ ┌────────┐ ┌────────────┐  │
│ │Content │ │ Side Panel  │  │
│ │ Script │ │  (React)    │  │
│ └───┬────┘ └──────┬─────┘  │
│     │  messages    │        │
│  ┌──▼─────────────▼──┐     │
│  │  Service Worker    │     │
│  └────────┬───────────┘     │
└───────────┼─────────────────┘
            │ HTTPS
┌───────────▼─────────────────┐
│   Backend (Fastify)          │
│ ┌─────────┐ ┌─────────────┐ │
│ │  Skills  │ │  Adapters   │ │
│ │ Pipeline │ │ (Memos/     │ │
│ │          │ │  Feishu)    │ │
│ └─────────┘ └─────────────┘ │
│ ┌──────────┐                │
│ │ Prisma   │                │
│ │ (PG 16)  │                │
│ └──────────┘                │
└──────────────────────────────┘
```

## Monorepo 结构

```
noteseed/
├── apps/
│   ├── extension/        # Chrome MV3 扩展（React + Vite + CRXJS）
│   └── backend/          # Fastify API 服务器
├── packages/
│   ├── shared-types/     # TypeScript 接口 + Zod 运行时校验
│   ├── skills/           # AI Skills 管线引擎
│   └── adapters/         # 第三方平台适配器
└── docs/
```

## AI 提供者架构

NoteSeed 支持用户自定义 AI 大模型，通过统一的 **LLM Provider 抽象层** 适配不同 API 协议：

```
┌──────────────────────────────────────────┐
│            LLM Provider Layer            │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │  Anthropic   │  │    OpenAI        │  │
│  │  Provider    │  │    Provider      │  │
│  │              │  │                  │  │
│  │ Claude API   │  │ OpenAI / DeepSeek│  │
│  │ 兼容端点     │  │ / Moonshot / GLM │  │
│  │              │  │ / Ollama / vLLM  │  │
│  └──────┬───────┘  └────────┬─────────┘  │
│         └──────┬─────────────┘           │
│                ▼                          │
│     Unified LLMProvider Interface        │
│     - chat(params)                       │
│     - chatWithTool(params, tool)         │
└──────────────────────────────────────────┘
```

### 配置优先级

1. **用户级配置**（数据库 `UserSettings.aiProviderJson`）— 每个用户可独立配置
2. **服务器环境变量**（`ANTHROPIC_API_KEY`）— 未配置用户级时的默认回退

### 支持的协议

| 协议 | 说明 | 兼容服务 |
|------|------|----------|
| **Anthropic** | Claude Messages API + tool_use | Anthropic 官方、AWS Bedrock 等 |
| **OpenAI** | Chat Completions API + function calling | OpenAI、DeepSeek、Moonshot、智谱 GLM、通义千问、Ollama、vLLM、LM Studio、Azure OpenAI 等 |

### 模型角色

| 角色 | 用途 | 默认（Anthropic） | 默认（OpenAI） |
|------|------|-------------------|----------------|
| **fast** | PageSense、Contextualizer、Tagger | claude-haiku-4-5 | gpt-4o-mini |
| **powerful** | Distiller | claude-sonnet-4-6 | gpt-4o |

## Skills 管线

知识卡片生成的核心管线（Orchestrator 编排）：

| 顺序 | Skill | 模型角色 | 职责 |
|------|-------|---------|------|
| 1 | PageSense | fast | 页面类型分类（8 类型） |
| 2 | Contextualizer | fast | 元数据补全（作者/日期/语言/阅读时间） |
| 3 | Distiller | powerful | 内容结构化提取（按类型分 prompt） |
| 4 | Tagger | fast | 标签/分类/主题生成 |
| 5 | Cardwright | 无 LLM | Markdown 模板渲染 |

每步都有降级路径：LLM 失败时回退到启发式规则或默认值。

## 数据流

1. **Capture**: Content Script → Readability + DOMPurify → PageSource
2. **Generate**: PageSource → Skills Pipeline（使用用户配置的 AI 提供者） → KnowledgeCard
3. **Preview**: KnowledgeCard → react-markdown 渲染 → 用户编辑
4. **Save**: KnowledgeCard → Adapter Dispatcher → Memos/Feishu

## 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 构建工具 | Vite + CRXJS | MV3 热重载开发体验最佳 |
| 状态管理 | Zustand | 比 Redux 轻量，3 个独立 store |
| LLM 接入 | 多提供者抽象层 | 支持 Anthropic tool_use 和 OpenAI function calling |
| LLM 协议 | Anthropic + OpenAI 兼容 | 覆盖主流大模型服务商 |
| ORM | Prisma 5 | 类型安全，schema-first |
| 凭证加密 | AES-256-GCM | 后端加密存储，前端不存明文 |
| 本地存储 | Dexie (IndexedDB) | 支持离线暂存，LRU 清理 |

## API 路由

| Method | Path | 功能 |
|--------|------|------|
| GET | /health | 健康检查 |
| POST | /api/v1/cards/generate | 生成知识卡片（使用用户 AI 配置） |
| POST | /api/v1/cards/save | 分发保存 |
| GET/PUT | /api/v1/settings | 用户设置（含 AI 提供者配置） |
| GET/PUT | /api/v1/credentials | 凭证管理 |
