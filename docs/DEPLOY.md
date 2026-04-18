# NoteSeed 部署指南

## 后端部署

### 环境变量

| 变量 | 必填 | 说明 |
|------|:----:|------|
| `DATABASE_URL` | ✅ | PostgreSQL 连接串 |
| `CREDENTIAL_ENCRYPTION_KEY` | ✅ | AES-256 密钥（Base64，≥32 字符） |
| `NODE_ENV` | | `production` / `development` |
| `PORT` | | 服务端口（默认 3000） |
| `LOG_LEVEL` | | 日志级别（默认 info） |

> AI API Key 无需在服务端配置 — 用户在扩展设置页的「AI 模型」Tab 中填写，每次请求随报文传入后端。

### Docker Compose 部署（推荐）

项目自带的 `docker-compose.yml` 包含 **PostgreSQL + Backend** 两个服务，一条命令启动：

```bash
# 配置加密密钥（首次）
export CREDENTIAL_ENCRYPTION_KEY=$(openssl rand -base64 32)

# 启动 PostgreSQL + Backend
docker compose up -d

# 运行数据库迁移
docker exec -it noteseed-backend sh -c \
  "cd /app/apps/backend && npx prisma migrate deploy"
```

启动后：
- **PostgreSQL** 运行在 `5432` 端口
- **Backend** 运行在 `3000` 端口

### 单独构建镜像

如需手动构建：

```bash
docker build -f apps/backend/Dockerfile -t noteseed-backend:1.0.0 .
```

> 更详细的云服务器部署教程见 → [1Panel 部署教程](./DEPLOY-1PANEL.md)

### 本地源码开发

如需调试后端源码（不用 Docker 容器里的后端）：

```bash
# 只启动 PostgreSQL 容器
docker compose up -d postgres

# 复制环境变量
cp .env.example .env
# 编辑 .env 填入 CREDENTIAL_ENCRYPTION_KEY

# 数据库初始化
pnpm --filter @noteseed/backend exec prisma migrate dev

# 启动后端（源码模式）
pnpm --filter @noteseed/backend dev
```

## 扩展部署

### 开发模式

```bash
pnpm --filter @noteseed/extension dev
```

在 Chrome `chrome://extensions` 开启开发者模式，加载 `apps/extension/dist` 目录。

### 扩展配置

加载扩展后打开设置页：

1. **通用** Tab — 配置后端地址（本地默认 `http://localhost:3000`，云服务器填对应地址）
2. **AI 模型** Tab — 选择 AI 提供者，填入 API Key 和模型名
3. **凭证** Tab — 填写 Memos Base URL 和 Token

### 生产构建

```bash
pnpm --filter @noteseed/extension build
```

`dist/` 目录即为可发布的扩展包。

### Chrome Web Store 发布

```bash
pnpm --filter @noteseed/extension build:zip
```

产出 `apps/extension/noteseed-extension.zip`，上传至 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)。

所需素材：
- 图标：16x16, 48x48, 128x128 PNG
- 截图：1280×800, 至少 3 张
- 描述文案（中 + 英）

## 监控指标

| 指标 | 来源 | 告警阈值 |
|------|------|----------|
| /health 可用性 | HTTP probe | 连续 3 次失败 |
| 制卡 P50 耗时 | Backend log (total_ms) | > 10s |
| 制卡 P95 耗时 | Backend log (total_ms) | > 20s |
| AI API 错误率 | Backend error log | > 5% |
| 数据库连接池 | Prisma metrics | 使用率 > 80% |

## 故障排查

参见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
