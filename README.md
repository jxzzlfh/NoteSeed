# NoteSeed 🌱

**Seed the web into your second brain.**

NoteSeed 是一款 Chrome 浏览器扩展（MV3），通过 5 阶段 AI Skills 管线将网页内容转化为结构化知识卡片，一键保存到 [Memos](https://usememos.com/) 等知识系统。

> 🧠 核心理念：浏览即学习 — 把碎片化阅读转化为可检索、可复用的知识资产。

---

## ✨ 功能亮点

| 功能 | 描述 |
|------|------|
| **智能分类** | 自动识别 8 种页面类型（教程 / 观点 / 新闻 / 文档 / 工具 / 资源 / 长文 / 讨论） |
| **AI 管线提取** | 5 阶段管线：分类 → 元数据补全 → 内容蒸馏 → 标签生成 → 卡片渲染 |
| **6 种卡片模板** | 平衡 / 精简 / 详细 / 教程提炼 / 观点摘要 / 自定义提示词 |
| **自定义 AI** | 支持 Anthropic 和 OpenAI 协议兼容的任意大模型（Claude / GPT / DeepSeek / Moonshot / GLM / Ollama 等） |
| **自定义提示词** | 输入任意提示词即可按你的方式制卡 |
| **一键制卡** | 从任意网页生成结构化 Markdown 知识卡片，支持编辑后保存 |
| **多目标分发** | 保存到 Memos（更多平台开发中） |
| **离线暂存** | Dexie (IndexedDB) 离线缓存 + LRU 清理，网络故障不丢数据 |
| **凭证加密** | AES-256-GCM 后端加密存储，前端不存明文 |
| **云部署** | 支持 Docker Compose 一键部署到云服务器 |

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
│ │ Pipeline │ │  (Memos)    │ │
│ └─────────┘ └─────────────┘ │
│ ┌──────────┐                │
│ │ Prisma   │                │
│ │ (PG 16)  │                │
│ └──────────┘                │
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
| 5 | **Cardwright** | 无 LLM | Markdown 模板渲染（6 种模板） |

每步都有降级路径：LLM 失败时回退到启发式规则或默认值。

### 卡片模板

| 模板 | 说明 |
|------|------|
| **平衡** (balanced) | 默认模板，摘要 + 要点 + 引述，适合大多数网页 |
| **精简** (concise) | 极简输出，一句话摘要 + 3 个核心要点 |
| **详细** (detailed) | 完整卡片，含引述、不同意见与反论点 |
| **教程提炼** (tutorial) | 提取步骤、前置条件、代码片段 |
| **观点摘要** (opinion) | 聚焦论点、论据、立场分析 |
| **自定义提示词** (custom) | 输入任意提示词，AI 按你的要求生成内容 |

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 扩展 | React 18, TypeScript 5, Vite 5, CRXJS (beta), Tailwind CSS 3, Zustand 5, Dexie 4 |
| 后端 | Node.js 20, Fastify 5, Prisma 5, PostgreSQL 16 |
| AI | 多提供者支持：Anthropic (tool_use) + OpenAI 兼容 (function calling)，用户可自定义 |
| 内容处理 | Readability, DOMPurify, Turndown (HTML→Markdown), react-markdown |
| 测试 | Vitest, 78+ 单元 / 集成测试（覆盖 skills / adapters / schemas / backend） |
| 工程化 | pnpm workspace monorepo, ESLint, Prettier, Docker |

---

## 🚀 快速开始

### 前置要求

- **Node.js** 20+
- **pnpm** 9+
- **Docker** & Docker Compose（用于 PostgreSQL）
- **AI API Key**（[Anthropic](https://console.anthropic.com/) 或 [OpenAI](https://platform.openai.com/) 或其他兼容服务）

### 1. 克隆 & 安装依赖

```bash
git clone https://github.com/jxzzlfh/NoteSeed.git noteseed
cd noteseed
pnpm install
```

### 2. 启动数据库

```bash
docker compose up -d    # PostgreSQL 16
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 填入必要值：

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串（默认值可直接用） |
| `CREDENTIAL_ENCRYPTION_KEY` | ✅ | AES-256 加密密钥（32 字节 base64） |
| `NODE_ENV` | | `development` / `production`（默认 `development`） |
| `PORT` | | 服务端口（默认 `3000`） |
| `LOG_LEVEL` | | 日志级别（默认 `info`） |

> 💡 **快速生成密钥:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
>
> AI API Key 不在 `.env` 中配置 — 用户在扩展设置页的「AI 模型」Tab 中填写，每次请求随报文传入后端。

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
4. 点击浏览器工具栏的 NoteSeed 图标，打开侧边栏

### 7. 初始配置

打开扩展设置页（侧边栏右上角 ⚙ 图标）：

1. **通用** Tab → 确认后端地址为 `http://localhost:3000`
2. **AI 模型** Tab → 选择 AI 提供者，填入 API Key 和模型名
3. **凭证** Tab → 填写 Memos Base URL 和 Token → 测试连接 → 保存

完成后即可在任意网页点击侧边栏一键制卡。

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
│   │   │   ├── side-panel/        # React 主界面（卡片预览/编辑/模板选择）
│   │   │   ├── options/           # 设置页面（后端地址/AI 模型/凭证配置）
│   │   │   └── shared/            # 消息定义 + Dexie 本地存储
│   │   ├── icons/                 # 扩展图标（SVG 源 + PNG 生成）
│   │   └── manifest.json
│   └── backend/                   # Fastify API 服务器
│       ├── src/
│       │   ├── routes/            # API 路由 (cards/settings/credentials)
│       │   ├── plugins/           # Fastify 插件 (Prisma)
│       │   └── utils/             # 工具函数 (加密等)
│       ├── prisma/
│       │   └── schema.prisma      # 数据模型 (User/Settings/Credential/SaveLog)
│       └── Dockerfile             # 生产容器镜像
├── packages/
│   ├── shared-types/              # TypeScript 接口 + Zod 运行时校验
│   ├── skills/                    # AI Skills 管线引擎
│   │   ├── page-sense/            # 页面分类 (8 种类型)
│   │   ├── contextualizer/        # 元数据补全 (作者/日期/阅读时间)
│   │   ├── distiller/             # 内容结构化提取 (含自定义提示词)
│   │   ├── tagger/                # 标签/分类/主题生成
│   │   ├── cardwright/            # Markdown 模板渲染 (6 种模板)
│   │   └── orchestrator/          # 管线编排 + 降级策略
│   └── adapters/                  # 第三方平台适配器
│       ├── memos/                 # Memos API 适配器
│       ├── feishu/                # 飞书 API 适配器 (开发中)
│       └── dispatcher.ts          # 统一分发入口
├── docs/                          # 项目文档
├── docker-compose.yml             # 本地开发 (PostgreSQL)
├── pnpm-workspace.yaml
└── package.json
```

---

## 🔌 API 路由

| 方法 | 路径 | 功能 |
|------|------|------|
| `GET` | `/health` | 健康检查 |
| `POST` | `/api/v1/cards/generate` | 调用 Skills 管线生成知识卡片 |
| `POST` | `/api/v1/cards/save` | 通过 Adapter 分发保存 |
| `GET` `PUT` | `/api/v1/settings` | 用户设置 CRUD |
| `GET` `PUT` | `/api/v1/credentials` | 加密凭证管理 |

---

## ☁️ 云服务器部署

NoteSeed 后端支持 Docker Compose 部署到云服务器，扩展端只需修改后端地址即可对接。

详细教程见 → [1Panel 云服务器部署指南](docs/DEPLOY-1PANEL.md)

---

## 📚 文档

| 文档 | 内容 |
|------|------|
| [架构概述](docs/ARCHITECTURE.md) | 系统架构、数据流、关键设计决策 |
| [Skills 调优指南](docs/SKILLS.md) | Prompt 模板、模型选择、降级策略 |
| [部署手册](docs/DEPLOY.md) | 生产环境部署、Docker、环境配置 |
| [1Panel 部署教程](docs/DEPLOY-1PANEL.md) | 1Panel 面板云服务器手把手部署 |
| [用户指南](docs/USER-GUIDE.md) | 扩展使用说明 |
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
