# NoteSeed 部署指南

## 后端部署

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| DATABASE_URL | ✅ | PostgreSQL 连接串 |
| REDIS_URL | ✅ | Redis 连接串 |
| JWT_SECRET | ✅ | JWT 签名密钥（≥16 字符） |
| CREDENTIAL_ENCRYPTION_KEY | ✅ | AES-256 密钥（Base64，≥32 字符） |
| ANTHROPIC_API_KEY | ✅ | Claude API Key |
| OPENAI_API_KEY | | OpenAI API Key（备用） |
| FEISHU_APP_ID | | 飞书应用 ID |
| FEISHU_APP_SECRET | | 飞书应用 Secret |
| NODE_ENV | | production / development |
| PORT | | 服务端口（默认 3000） |
| LOG_LEVEL | | 日志级别（默认 info） |

### Docker 部署

```bash
# 构建镜像
docker build -f apps/backend/Dockerfile -t noteseed-backend:1.0.0 .

# 启动基础设施
docker compose up -d postgres redis

# 运行数据库迁移
DATABASE_URL="postgresql://noteseed:noteseed@localhost:5432/noteseed" \
  npx prisma migrate deploy --schema apps/backend/prisma/schema.prisma

# 启动后端
docker run -d \
  --name noteseed-backend \
  --network host \
  -e DATABASE_URL="postgresql://noteseed:noteseed@localhost:5432/noteseed" \
  -e REDIS_URL="redis://localhost:6379" \
  -e JWT_SECRET="your-jwt-secret-here" \
  -e CREDENTIAL_ENCRYPTION_KEY="your-base64-key" \
  -e ANTHROPIC_API_KEY="sk-ant-..." \
  -p 3000:3000 \
  noteseed-backend:1.0.0
```

### 本地开发

```bash
# 启动 PostgreSQL + Redis
docker compose up -d

# 复制环境变量
cp .env.example .env
# 编辑 .env 填入真实值

# 数据库初始化
cd apps/backend && npx prisma migrate dev

# 启动后端
pnpm --filter @noteseed/backend dev
```

## 扩展部署

### 开发模式

```bash
pnpm --filter @noteseed/extension dev
```

在 Chrome `chrome://extensions` 开启开发者模式，加载 `apps/extension/dist` 目录。

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
| Anthropic API 错误率 | Backend error log | > 5% |
| 数据库连接池 | Prisma metrics | 使用率 > 80% |

## 故障排查

参见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
