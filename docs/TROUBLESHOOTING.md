# NoteSeed 常见问题排查

## 扩展问题

### "页面内容为空"
**原因**: SPA 页面首屏由 JS 渲染，Content Script 在 DOM 就绪前执行。
**解决**: 等待页面加载完毕后点击"重新识别"。

### 插件图标点击无反应
**原因**: CRXJS 热重载偶尔断开。
**解决**: 在 `chrome://extensions` 点击扩展的刷新按钮。

### Side Panel 显示"登录已过期"
**原因**: JWT Token 已过期或后端不可达。
**解决**: 打开设置页面重新登录。

## 后端问题

### `Invalid environment variables` 启动失败
**原因**: 缺少必填环境变量。
**解决**: 检查 `.env` 文件，确保所有必填项都已配置。参见 `DEPLOY.md` 环境变量表。

### Prisma: `Can't reach database server`
**原因**: PostgreSQL 未启动或 DATABASE_URL 错误。
**解决**:
```bash
docker compose up -d postgres
# 验证连接
psql $DATABASE_URL -c "SELECT 1"
```

### `Anthropic API: 429 Rate Limited`
**原因**: Claude API 请求超出限额。
**解决**: 检查 Anthropic Console 用量，升级计划或等待限流窗口重置。

### 制卡耗时 > 20 秒
**可能原因**:
1. Distiller (Sonnet) 步骤耗时长 — 检查 `distiller_ms` 日志
2. 网络延迟 — 检查到 api.anthropic.com 的 RTT
3. 大页面 cleanText — 考虑截断输入文本

**排查**: 查看后端日志中的 `timings` 对象，找出瓶颈步骤。

## Adapter 问题

### Memos 保存失败："Memos createMemo failed: 401"
**原因**: Memos Access Token 过期或无效。
**解决**: 在扩展设置页面更新 Memos Token，点击"测试连接"验证。

### 飞书保存失败："获取 tenant_access_token 失败"
**原因**: App ID / App Secret 错误或应用权限不足。
**解决**:
1. 确认 App ID 和 Secret 正确
2. 在飞书开放平台检查应用权限（需要 `docx:document:create` 等）
3. 确认应用已发布到可用范围

## 开发问题

### `pnpm install` 卡在 postinstall
**原因**: Prisma 生成客户端时网络问题。
**解决**: `PRISMA_ENGINES_MIRROR=https://registry.npmmirror.com/-/binary/prisma npx prisma generate`

### TypeScript 编译报错 "Cannot find module"
**原因**: workspace 包未构建。
**解决**: `pnpm build` 先构建所有包。

### ESLint 版本冲突
**原因**: 项目锁定 ESLint 8.x，部分依赖可能安装 10.x。
**解决**: 确保 `package.json` 中 ESLint 版本为 `^8.57.0`。
