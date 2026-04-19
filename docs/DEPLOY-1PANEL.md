# NoteSeed 后端 — 1Panel 云服务器部署教程

本教程手把手教你将 NoteSeed 后端从 Windows 本地迁移到安装了 [1Panel](https://1panel.cn/docs/) 面板的云服务器。

> **部署的是什么？** 只部署 **后端 API 服务**（`apps/backend`）和 **PostgreSQL 数据库**。
> 浏览器扩展仍然在本地 Chrome/Edge 中运行，只需在扩展设置页 → **通用** → **NoteSeed 后端地址** 改为云服务器地址即可。

---

## 目录

1. [架构概览](#1-架构概览)
2. [前置准备](#2-前置准备)
3. [上传项目到服务器](#3-上传项目到服务器)
4. [通过 1Panel 安装 PostgreSQL](#4-通过-1panel-安装-postgresql)
5. [配置环境变量](#5-配置环境变量)
6. [使用 Docker Compose 部署后端](#6-使用-docker-compose-部署后端)
7. [运行数据库迁移](#7-运行数据库迁移)
8. [配置反向代理与 HTTPS](#8-配置反向代理与-https)
9. [扩展端对接云服务器](#9-扩展端对接云服务器)
10. [验证部署](#10-验证部署)
11. [日常维护](#11-日常维护)
12. [常见问题](#12-常见问题)

---

## 1. 架构概览

```
┌──────────────────────────────────┐
│     你的浏览器 (Chrome / Edge)    │
│  ┌────────────────────────────┐  │
│  │    NoteSeed 浏览器扩展      │  │
│  │                            │  │
│  │  设置页「通用」Tab：         │  │
│  │   NoteSeed 后端地址 ───────────── 指向云服务器
│  │                            │  │
│  │  设置页「AI 模型」Tab：      │  │
│  │   API Key 存在扩展本地      │  │
│  │                            │  │
│  │  设置页「凭证」Tab：         │  │
│  │   Memos URL + Token ──────────── 通过后端加密存储
│  └────────────────────────────┘  │
└──────────────┬───────────────────┘
               │  HTTPS
               ▼
┌──────────────────────────────────────────┐
│          云服务器 (1Panel)                │
│                                          │
│  ┌─────────────┐    ┌────────────────┐   │
│  │  Nginx 反代  │───▶│ NoteSeed 后端  │   │
│  │  (1Panel)    │    │  :3000         │   │
│  └─────────────┘    └───────┬────────┘   │
│                             │            │
│                     ┌───────▼────────┐   │
│                     │  PostgreSQL    │   │
│                     │  :5432         │   │
│                     └────────────────┘   │
│                                          │
│  后端调用外部 API：                       │
│  · AI API (Anthropic/OpenAI/DeepSeek)    │
│  · 你的 Memos 服务器                      │
└──────────────────────────────────────────┘
```

**数据流向**：扩展将 AI Key 和页面内容发送给后端 → 后端调用 AI API 生成卡片 → 后端调用 Memos API 保存卡片。

> **安全提示**：AI API Key 随每次请求从扩展传入后端（不落盘）。Memos Token 由后端 AES-256 加密后存储在 PostgreSQL 中。**生产环境务必使用 HTTPS**。

---

## 2. 前置准备

### 服务器要求

| 项目 | 最低要求 |
|------|---------|
| 系统 | Ubuntu 20.04+ / Debian 11+ / CentOS 7+ |
| 内存 | 1 GB（推荐 2 GB） |
| 硬盘 | 10 GB 可用空间 |
| 1Panel | 已安装并可通过浏览器访问 |
| 端口 | 80、443（Web），3000（后端 API，可选） |

### 你需要准备

- 一个域名（推荐，用于 HTTPS），或者直接用 IP + 端口
- 服务器 SSH 登录凭据
- NoteSeed 项目源码

---

## 3. 上传项目到服务器

### 方案 A：Git 克隆（推荐）

```bash
ssh root@你的服务器IP

mkdir -p /opt/noteseed && cd /opt/noteseed
git clone https://github.com/你的用户名/NoteSeed.git .
```

### 方案 B：通过 1Panel 文件管理上传

1. 在本地 PowerShell 打包（排除不需要的文件）：

```powershell
cd D:\Downloads\NoteSeed
tar -czf noteseed.tar.gz --exclude=node_modules --exclude=.git --exclude=dist .
```

2. 1Panel 面板 → **文件管理** → 创建 `/opt/noteseed` 目录
3. 上传 `noteseed.tar.gz` 到该目录
4. 1Panel **终端** 解压：

```bash
cd /opt/noteseed
tar -xzf noteseed.tar.gz && rm noteseed.tar.gz
```

---

## 4. 通过 1Panel 安装 PostgreSQL

### 方式一：1Panel 应用商店（推荐新手）

1. 1Panel → **应用商店** → 搜索 **PostgreSQL** → 安装
2. 填写参数：
   - 端口：`5432`
   - 用户名：`postgres`
   - 密码：**设一个强密码，记下来**
   - 数据库名：`noteseed`
3. 确认安装

> 如果用应用商店装 PostgreSQL，后续 `DATABASE_URL` 里的主机名不能写 `postgres`（那是 Docker 容器名），要写 `host.docker.internal` 或服务器内网 IP。详见 [常见问题](#q-数据库连接失败)。

### 方式二：跟后端一起用 Docker Compose

跳过此步，在第 6 步通过 `docker-compose.prod.yml` 一并部署。

---

## 5. 配置环境变量

```bash
cd /opt/noteseed
```

先生成加密密钥：

```bash
openssl rand -base64 32
# 输出类似：RhDoqEsYbBcajWjpxyS4dXOLkwOtvZ4fzCvA1gE2cSc=
```

创建 `.env.production`（把下面的 `你的密码` 和 `你的密钥` 替换为真实值）：

```bash
cat > .env.production << 'EOF'
# ===== PostgreSQL（被 docker-compose.prod.yml 的 env_file 直接读取）=====
POSTGRES_PASSWORD=你的密码

# ===== 后端连接串（密码要与上面一致）=====
# Docker Compose 内部署用 postgres，1Panel 应用商店装的用 host.docker.internal
DATABASE_URL=postgresql://postgres:你的密码@postgres:5432/noteseed

# ===== 凭据加密 (AES-256) =====
CREDENTIAL_ENCRYPTION_KEY=你的密钥

# ===== 运行时 =====
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
EOF
```

> **重要**：`POSTGRES_PASSWORD` 的值必须与 `DATABASE_URL` 连接串中的密码保持一致。

---

## 6. 使用 Docker Compose 部署后端

### 6.1 确认 Docker 可用

```bash
docker --version
docker compose version
```

没有的话：1Panel → **工具箱** → **Docker** → 一键安装。

### 6.2 确认生产 Compose 文件

项目已自带 `docker-compose.prod.yml`，无需手动创建。该文件通过 `env_file: .env.production` 自动将变量注入容器。

### 6.3 构建并启动

```bash
cd /opt/noteseed
docker compose -f docker-compose.prod.yml up -d --build
```

首次构建约 3–5 分钟。查看日志：

```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

看到这行表示成功：

```
🌱 NoteSeed Backend running on http://localhost:3000
```

`Ctrl+C` 退出日志查看。

---

## 7. 运行数据库迁移

```bash
docker exec -it noteseed-backend sh -c \
  "cd /app/apps/backend && npx prisma@5.20.0 migrate deploy"
```

输出 `All migrations have been successfully applied` 即完成。

---

## 8. 配置反向代理与 HTTPS

### 有域名（推荐）

1. DNS 解析 → 添加 A 记录：`noteseed.你的域名.com` → 服务器 IP
2. 1Panel → **网站** → **创建网站** → **反向代理**
   - 域名：`noteseed.你的域名.com`
   - 代理地址：`http://127.0.0.1:3000`
3. 创建完成后 → 点击该站点 → **HTTPS**
   - 申请证书 → Let's Encrypt → 填邮箱 → 申请
   - 开启 **强制 HTTPS**

最终后端地址：`https://noteseed.你的域名.com`

### 无域名（IP 直连）

放行 3000 端口：

```bash
# firewalld
firewall-cmd --permanent --add-port=3000/tcp && firewall-cmd --reload

# 或 ufw
ufw allow 3000/tcp
```

也可在 1Panel → **安全** → **防火墙** → 添加规则（TCP / 3000 / 允许）。

最终后端地址：`http://你的服务器IP:3000`

---

## 9. 扩展端对接云服务器

这是最关键的一步——让浏览器扩展指向云服务器。

### 9.1 配置后端地址

1. 在 Chrome 地址栏点击 **NoteSeed 扩展图标**
2. 点击右上角 **⚙ 齿轮图标** 打开设置页
3. 在 **「通用」** Tab 中，找到 **NoteSeed 后端地址**
4. 将默认的 `http://localhost:3000` 改为：

| 场景 | 填写内容 |
|------|---------|
| 有域名 + HTTPS | `https://noteseed.你的域名.com` |
| 无域名用 IP | `http://你的服务器IP:3000` |

5. 点击 **「保存」** 按钮

### 9.2 配置 Memos 凭证

1. 切换到 **「凭证」** Tab
2. 填写 Memos Base URL 和 Token
3. 点击 **「测试连接」** — 应显示「Memos 连接成功（用户：xxx）」
4. 点击 **「保存 Memos 配置」**

### 9.3 配置 AI 模型

1. 切换到 **「AI 模型」** Tab
2. 选择 AI 提供者（Anthropic / OpenAI / DeepSeek 等）
3. 填写 API Key 和模型名
4. 点击 **「保存 AI 配置」**

> AI Key 不经过服务器存储，每次制卡时随请求传给后端临时使用。

---

## 10. 验证部署

### 服务器端健康检查

```bash
curl -s -X POST http://localhost:3000/api/v1/cards/generate \
  -H "Content-Type: application/json" -d '{}' | head -c 100
```

返回 `{"error":"Invalid request body"...}` 说明后端正常运行（参数不对但服务在线）。

### 浏览器端验证

1. 打开任意网页 → 点击 NoteSeed 侧边栏
2. 选一个模板 → 点击 **⚡ 一键制卡**
3. 生成成功后点击 **「+ 保存」** → 提示保存成功
4. 打开 Memos 确认卡片已到达

---

## 11. 日常维护

### 更新代码部署

```bash
cd /opt/noteseed
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# 若有数据库 schema 变更
docker exec -it noteseed-backend sh -c \
  "cd /app/apps/backend && npx prisma@5.20.0 migrate deploy"
```

### 常用命令

```bash
# 查看容器状态
docker compose -f docker-compose.prod.yml ps

# 查看后端日志（实时）
docker compose -f docker-compose.prod.yml logs -f backend --tail 100

# 重启后端
docker compose -f docker-compose.prod.yml restart backend

# 停止所有服务
docker compose -f docker-compose.prod.yml down

# 进入容器排查
docker exec -it noteseed-backend sh
```

### 数据库备份

手动备份：

```bash
docker exec noteseed-postgres pg_dump -U postgres noteseed > \
  /opt/backups/noteseed_$(date +%Y%m%d).sql
```

1Panel 定时备份：

1. **计划任务** → **创建任务** → Shell 脚本
2. 周期：每天凌晨 3 点
3. 脚本：

```bash
mkdir -p /opt/backups
docker exec noteseed-postgres pg_dump -U postgres noteseed | \
  gzip > /opt/backups/noteseed_$(date +%Y%m%d_%H%M%S).sql.gz
find /opt/backups -name "noteseed_*.sql.gz" -mtime +30 -delete
```

恢复：

```bash
zcat /opt/backups/noteseed_20260418_030000.sql.gz | \
  docker exec -i noteseed-postgres psql -U postgres noteseed
```

---

## 12. 常见问题

### Q: 构建报错 `pnpm-lock.yaml` 找不到

上传时遗漏了该文件。确认：

```bash
ls -la /opt/noteseed/pnpm-lock.yaml
```

### Q: 后端启动报 `Invalid environment variables`

`.env.production` 中缺少必要变量或格式错误。必填项：
- `DATABASE_URL`（合法的 PostgreSQL 连接串）
- `CREDENTIAL_ENCRYPTION_KEY`（至少 32 字符的 base64 字符串）

### Q: 数据库连接失败

| PostgreSQL 安装方式 | DATABASE_URL 里的主机名 |
|---------------------|------------------------|
| docker-compose.prod.yml 一起部署 | `postgres`（Compose 服务名） |
| 1Panel 应用商店独立安装 | `host.docker.internal` 或服务器内网 IP |
| 服务器直接安装（非 Docker） | `localhost` |

### Q: 扩展报 `NETWORK_ERROR`

1. 确认 **通用设置** 里的「NoteSeed 后端地址」填写正确
2. 确认服务器防火墙已放行对应端口
3. 如果用 HTTPS，确认证书有效（浏览器直接访问该地址不报错）
4. 浏览器 F12 → Network 查看具体请求失败原因

### Q: 制卡成功但保存到 Memos 失败

1. 去 **凭证** Tab 重新 **测试连接**
2. 确认 Memos 服务对云服务器可达（后端是从服务器发起请求到 Memos，不是从你的浏览器）
3. 如果 Memos 也在同一台服务器上，URL 用 `http://localhost:端口` 或内网 IP

### Q: 构建很慢 / 内存不足

1GB 内存的小机器构建可能 OOM。解决方案：
- 在本地构建好镜像再推到服务器
- 或给服务器加 swap：`fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`
