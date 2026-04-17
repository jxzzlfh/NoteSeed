# Phase 6 完成报告

## 已完成任务
- [x] Task 6.1 Content Script 真实抓取（Readability + DOMPurify + Turndown）
- [x] Task 6.2 Service Worker 消息路由（API Client + Auth + Handlers）
- [x] Task 6.3 Side Panel UI 组件（TopBar / PageInfo / ActionBar / CardPreview / TargetPicker / ExportBar / LoadingProgress / Toast）
- [x] Task 6.4 Zustand 状态管理（capture-store / card-store / save-store）
- [x] Task 6.5 端到端流程串通（capture → generate → preview → save）
- [x] Task 6.6 Options 设置页（通用 / 账号 / 凭证 / 关于）

## 改动文件列表

```
apps/extension/src/
├── content-script/
│   ├── index.ts                              # CAPTURE_PAGE → buildPageSource
│   └── extractors/
│       ├── extract-content.ts                # Readability + DOMPurify + Turndown
│       ├── extract-metadata.ts               # OG/meta/JSON-LD 提取
│       └── extract-selection.ts              # window.getSelection
├── service-worker/
│   ├── index.ts                              # 消息路由 dispatcher
│   ├── api-client.ts                         # HTTP 客户端 (JWT auto-attach)
│   ├── auth.ts                               # chrome.storage JWT 管理
│   ├── mock-card.ts                          # 开发用 mock 数据
│   └── handlers/
│       ├── capture-page.ts                   # tabId 解析 + CS 注入
│       ├── generate-card.ts                  # POST /cards/generate
│       └── save-card.ts                      # POST /cards/save + IndexedDB
├── side-panel/
│   ├── App.tsx                               # 主容器 + 流程编排
│   ├── labels.ts                             # 页面类型 / 模板标签
│   ├── store/
│   │   ├── capture-store.ts                  # Zustand: 页面抓取状态
│   │   ├── card-store.ts                     # Zustand: 制卡 + 编辑状态
│   │   └── save-store.ts                     # Zustand: 保存状态
│   └── components/
│       ├── TopBar.tsx                        # 🌱 NoteSeed + 页面类型 badge
│       ├── PageInfoPanel.tsx                 # 标题 / 域名 / 作者 / 日期
│       ├── ActionBar.tsx                     # 一键制卡 + 重新识别 + 模板选择
│       ├── CardPreview.tsx                   # Markdown 预览 + 源码切换 + 标签编辑
│       ├── TargetPicker.tsx                  # Memos / 飞书 / Get / 金山 checkbox
│       ├── ExportBar.tsx                     # 复制 / 下载 / 保存
│       ├── LoadingProgress.tsx               # 管线阶段进度
│       └── ToastStack.tsx                    # 通知 toast
└── options/
    └── App.tsx                               # 通用 / 账号 / 凭证 / 关于 tabs
```

## 验收清单
- [x] Content Script 正确抓取：Readability + DOMPurify 清洗 + Turndown 转 Markdown
- [x] OG / meta / JSON-LD 元数据提取
- [x] Service Worker 路由分发三种消息
- [x] API Client 自动携带 JWT、401 自动清理
- [x] Side Panel 完整流程：capture → generate → preview → edit → save
- [x] Markdown 预览 / 源码双视图
- [x] 标题可编辑、标签可增删
- [x] 复制到剪贴板 / 下载 .md 文件
- [x] Options 页四个 Tab 完整
- [x] Memos 测试连接可用
- [x] TypeScript 编译 0 错误
- [x] Vite 构建成功（347 modules, ~588KB total）

## 已知问题
- generate-card handler 调用后端 API；后端尚未实现 /api/v1/cards/generate 路由（Phase 7 联调）
- mock-card.ts 提供离线开发数据，正式联调后可移除
- 飞书测试连接为演示模式，尚未调用真实 API

## 关键决策
- Zustand 替代 Redux：API 简洁，store 切分为 3 个独立 slice
- CardPreview 支持 preview/source 双模式，满足高级用户编辑需求
- Pipeline loading 使用模拟延迟（350ms steps）增强感知反馈，后续接入流式事件
