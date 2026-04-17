# Phase 2 完成报告

## 已完成任务
- [x] Task 2.1 Fastify 服务骨架（app.ts, plugins, routes, env validation）
- [x] Task 2.2 Prisma 数据模型（User, UserSettings, UserCredential, SaveLog）
- [x] Task 2.3 鉴权中间件（magic link login + JWT verify + auth guard）
- [x] Task 2.4 凭证加密工具（AES-256-GCM encrypt/decrypt with 7 tests）

## 改动文件列表

```
apps/backend/
├── vitest.config.ts
├── prisma/
│   └── schema.prisma                    # 4 个 model
├── src/
│   ├── index.ts                         # 入口
│   ├── app.ts                           # Fastify 实例构建
│   ├── config/
│   │   └── env.ts                       # Zod 环境变量校验
│   ├── lib/
│   │   └── prisma.ts                    # PrismaClient 单例
│   ├── plugins/
│   │   ├── cors.ts
│   │   ├── helmet.ts
│   │   ├── jwt.ts
│   │   ├── error-handler.ts
│   │   └── auth-guard.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── health.ts                    # GET /health
│   │   └── auth/
│   │       └── login.ts                 # POST /api/v1/auth/login + verify
│   ├── types/
│   │   └── fastify.d.ts                 # JWT payload type augmentation
│   └── utils/
│       ├── logger.ts
│       ├── crypto.ts                    # AES-256-GCM
│       └── __tests__/
│           └── crypto.test.ts           # 7 tests all pass
```

## 验收清单勾选情况
- [x] Fastify 服务可构建（tsc 编译通过）
- [x] 健康检查路由 GET /health 定义
- [x] 数据库 4 张表（User, UserSettings, UserCredential, SaveLog）schema 定义
- [x] Prisma Client 生成成功
- [x] JWT 鉴权框架就位（login + verify + guard）
- [x] 凭证加密工具 7 测试全部通过

## 已知问题 / 潜在风险
- 需要运行中的 PostgreSQL 才能执行 prisma migrate（需 docker compose up）
- Magic link 登录仅打印到控制台，上线前需替换为真实邮件服务
- magic token 存在内存中，重启丢失；生产环境需迁移到 Redis

## 下一 Phase 需要的前置条件
- ANTHROPIC_API_KEY 需就位才能进行 Phase 3 的集成测试
- shared-types 包已 build

## 关键决策记录
- 使用 Prisma v5 而非 v7，因为 v7 引入了破坏性的 datasource URL 迁移
- JWT payload 使用 { userId, email } 简洁结构
- MVP 阶段 magic token 用内存 Map，足够开发使用
