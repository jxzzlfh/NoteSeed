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
│ ┌──────────┐ ┌────────────┐ │
│ │ Prisma   │ │   Redis    │ │
│ │ (PG 16)  │ │   (缓存)    │ │
│ └──────────┘ └────────────┘ │
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

## Skills 管线

知识卡片生成的核心管线（Orchestrator 编排）：

| 顺序 | Skill | 模型 | 职责 |
|------|-------|------|------|
| 1 | PageSense | Haiku | 页面类型分类（8 类型） |
| 2 | Contextualizer | Haiku | 元数据补全（作者/日期/语言/阅读时间） |
| 3 | Distiller | Sonnet | 内容结构化提取（按类型分 prompt） |
| 4 | Tagger | Haiku | 标签/分类/主题生成 |
| 5 | Cardwright | 无 LLM | Markdown 模板渲染 |

每步都有降级路径：LLM 失败时回退到启发式规则或默认值。

## 数据流

1. **Capture**: Content Script → Readability + DOMPurify → PageSource
2. **Generate**: PageSource → Skills Pipeline → KnowledgeCard
3. **Preview**: KnowledgeCard → react-markdown 渲染 → 用户编辑
4. **Save**: KnowledgeCard → Adapter Dispatcher → Memos/Feishu

## 关键设计决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 构建工具 | Vite + CRXJS | MV3 热重载开发体验最佳 |
| 状态管理 | Zustand | 比 Redux 轻量，3 个独立 store |
| LLM 接入 | Anthropic tool_use | 保证结构化 JSON 输出 |
| ORM | Prisma 5 | 类型安全，schema-first |
| 凭证加密 | AES-256-GCM | 后端加密存储，前端不存明文 |
| 本地存储 | Dexie (IndexedDB) | 支持离线暂存，LRU 清理 |

## API 路由

| Method | Path | 功能 |
|--------|------|------|
| GET | /health | 健康检查 |
| POST | /api/v1/auth/login | 发送 Magic Link |
| POST | /api/v1/auth/verify | 验证 Token → JWT |
| POST | /api/v1/cards/generate | 生成知识卡片 |
| POST | /api/v1/cards/save | 分发保存 |
| GET/PUT | /api/v1/settings | 用户设置 |
| GET/PUT | /api/v1/credentials | 凭证管理 |
