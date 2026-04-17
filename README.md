# NoteSeed 🌱

**Seed the web into your second brain.**

NoteSeed 是一款 Chrome 浏览器扩展（MV3），通过 5 阶段 AI Skills 管线将网页内容转化为结构化知识卡片，一键分发到 Memos、飞书等知识系统。

> 🧠 核心理念：浏览即学习 — 把碎片化阅读转化为可检索、可复用的知识资产。

---

## ✨ 功能亮点

| 功能 | 描述 |
|------|------|
| **智能分类** | 自动识别 8 种页面类型（教程 / 观点 / 新闻 / 文档 / 问答 / 产品 / 参考 / 通用） |
| **AI 管线提取** | 5 阶段管线：分类 → 元数据补全 → 内容蒸馏 → 标签生成 → 卡片渲染 |
| **自定义 AI** | 支持 Anthropic 和 OpenAI 协议兼容的任意大模型（Claude / GPT / DeepSeek / Moonshot / GLM / Ollama 等） |
| **一键制卡** | 从任意网页生成结构化 Markdown 知识卡片，支持用户编辑后保存 |
| **多目标分发** | 同时保存到 Memos、飞书（更多平台开发中） |
| **离线暂存** | Dexie (IndexedDB) 离线缓存 + LRU 清理，网络故障不丢数据 |
| **凭证加密** | AES-256-GCM 后端加密存储，前端不存明文 |

---

## 🏗️ 架构概览

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
│ │ Pipeline │ │(Memos/Feishu│ │
│ └─────────┘ └─────────────┘ │
│ ┌──────────┐ ┌────────────┐ │
│ │ Prisma   │ │   Redis    │ │
│ │ (PG 16)  │ │   (缓存)   │ │
│ └──────────┘ └────────────┘ │
└──────────────────────────────┘
```

**数据流:** Content Script 抓取 → Readability 清洗 → Skills Pipeline 生成 KnowledgeCard → react-markdown 预览 → Adapter Dispatcher 分发保存

### AI Skills 管线

| 阶段 | Skill | 模型角色 | 职责 |
|------|-------|---------|------|
| 1 | **PageSense** | fast | 页面类型分类（8 种类型） |
| 2 | **Contextualizer** | fast | 元数据补全（作者 / 日期 / 语言 / 阅读时间） |
| 3 | **Distiller** | powerful | 内容结构化提取（按类型定制 prompt） |
| 4 | **Tagger** | fast | 标签 / 分类 / 主题生成 |
| 5 | **Cardwright** | 无 LLM | Markdown 模板渲染 |

每步都有降级路径：LLM 失败时回退到启发式规则或默认值。

> 用户可在扩展设置页的「AI 模型」tab 中自定义 AI 提供者、API 地址和模型 ID。

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 扩展 | React 18, TypeScript 5, Vite 5, CRXJS (beta), Tailwind CSS 3, Zustand 5, Dexie 4 |
| 后端 | Node.js 20, Fastify 5, Prisma 5, PostgreSQL 16, Redis 7 |
| AI | 多提供者支持：Anthropic (tool_use) + OpenAI 兼容 (function calling)，用户可自定义 |
| 内容处理 | Readability, DOMPurify, Turndown (HTML→Markdown), react-markdown |
| 测试 | Vitest, 78+ 单元 / 集成测试（覆盖 skills / adapters / schemas / backend） |
| 工程化 | pnpm workspace monorepo, ESLint, Prettier |

---

## 🚀 快速开始

### 前置要求

- **Node.js** 20+
- **pnpm** 9+
- **Docker** & Docker Compose（用于 PostgreSQL + Redis）
- **AI API Key**（[Anthropic](https://console.anthropic.com/) 或 [OpenAI](https://platform.openai.com/) 或其他兼容服务）

### 1. 克隆 & 安装依赖

```bash
git clone <repo-url> noteseed
cd noteseed
pnpm install
```

### 2. 启动基础设施

```bash
docker compose up -d    # PostgreSQL 16 + Redis 7
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 填入必要值：

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串（默认值可直接用） |
| `REDIS_URL` | ✅ | Redis 连接串（默认值可直接用） |
| `JWT_SECRET` | ✅ | 32 字节随机 base64 字符串 |
| `CREDENTIAL_ENCRYPTION_KEY` | ✅ | AES-256 加密密钥（32 字节 base64） |
| `ANTHROPIC_API_KEY` | ⬜ | Anthropic API 密钥（用户可在扩展设置中自定义 AI 提供者） |
| `OPENAI_API_KEY` | ⬜ | OpenAI 密钥（可选） |
| `FEISHU_APP_ID` / `FEISHU_APP_SECRET` | ⬜ | 飞书应用凭证（使用飞书适配器时需要） |

> 💡 **快速生成密钥:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### 4. 初始化数据库

```bash
pnpm --filter @noteseed/backend exec prisma migrate dev
```

### 5. 启动开发服务

```bash
# 终端 1 — 后端 (http://localhost:3000)
pnpm --filter @noteseed/backend dev

# 终端 2 — 扩展热重载
pnpm --filter @noteseed/extension dev
```

### 6. 加载扩展

1. 打开 Chrome，访问 `chrome://extensions`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」→ 选择 `apps/extension/dist` 目录
4. 点击浏览器工具栏的 NoteSeed 图标，打开侧边栏开始使用

---

## 📦 构建 & 测试

```bash
# 构建所有包
pnpm build

# 仅构建扩展 zip（用于发布）
pnpm --filter @noteseed/extension build:zip

# 运行全部测试
pnpm test

# 代码检查 & 格式化
pnpm lint
pnpm format:check
```

---

## 📁 项目结构

```
noteseed/
├── apps/
│   ├── extension/                 # Chrome MV3 扩展
│   │   ├── src/
│   │   │   ├── content-script/    # Readability + DOMPurify 页面抓取
│   │   │   ├── service-worker/    # 消息路由 + 后端 API 调用
│   │   │   ├── side-panel/        # React 主界面（卡片预览/编辑）
│   │   │   ├── options/           # 设置页面（凭证/偏好配置）
│   │   │   └── shared/            # 消息定义 + Dexie 本地存储
│   │   └── manifest.json
│   └── backend/                   # Fastify API 服务器
│       ├── src/
│       │   ├── routes/            # API 路由 (auth/cards/settings/credentials)
│       │   ├── plugins/           # Fastify 插件 (JWT/Prisma/Redis)
│       │   └── utils/             # 工具函数 (加密等)
│       └── prisma/
│           └── schema.prisma      # 数据模型 (User/Settings/Credential/SaveLog)
├── packages/
│   ├── shared-types/              # TypeScript 接口 + Zod 运行时校验
│   ├── skills/                    # AI Skills 管线引擎
│   │   ├── page-sense/            # 页面分类 (8 种类型)
│   │   ├── contextualizer/        # 元数据补全 (作者/日期/阅读时间)
│   │   ├── distiller/             # 内容结构化提取
│   │   ├── tagger/                # 标签/分类/主题生成
│   │   ├── cardwright/            # Markdown 模板渲染
│   │   └── orchestrator/          # 管线编排 + 降级策略
│   └── adapters/                  # 第三方平台适配器
│       ├── memos/                 # Memos API 适配器
│       ├── feishu/                # 飞书 API 适配器
│       └── dispatcher.ts          # 统一分发入口
├── docs/                          # 项目文档
├── docker-compose.yml             # PostgreSQL 16 + Redis 7
├── pnpm-workspace.yaml
└── package.json
```

---

## 🔌 API 路由

| 方法 | 路径 | 功能 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `POST` | `/api/v1/auth/login` | 发送 Magic Link |
| `POST` | `/api/v1/auth/verify` | 验证 Token → 签发 JWT |
| `POST` | `/api/v1/cards/generate` | 调用 Skills 管线生成知识卡片 |
| `POST` | `/api/v1/cards/save` | 通过 Adapter 分发保存 |
| `GET` `PUT` | `/api/v1/settings` | 用户设置 CRUD |
| `GET` `PUT` | `/api/v1/credentials` | 加密凭证管理 |

---

## 📚 文档

| 文档 | 内容 |
|------|------|
| [架构概述](docs/ARCHITECTURE.md) | 系统架构、数据流、关键设计决策 |
| [Skills 调优指南](docs/SKILLS.md) | Prompt 模板、模型选择、降级策略 |
| [部署手册](docs/DEPLOY.md) | 生产环境部署、Docker、环境配置 |
| [问题排查](docs/TROUBLESHOOTING.md) | 常见问题与解决方案 |

---

## 🤝 贡献指南

1. Fork 仓库
2. 创建 feature 分支：`git checkout -b feat/amazing-feature`
3. 编写代码并补充测试
4. 提交：`git commit -m "feat(scope): add amazing feature"`
5. 推送：`git push origin feat/amazing-feature`
6. 提交 Pull Request

### 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>

type:  feat | fix | refactor | docs | test | chore | perf
scope: extension | backend | skills | adapters | shared-types
```

示例：
- `feat(skills): add support for recipe page type`
- `fix(extension): resolve side panel blank screen on Firefox`
- `refactor(adapters): extract common HTTP client`

---

## License

MIT
