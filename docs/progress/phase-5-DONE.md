# Phase 5 完成报告

## 已完成任务
- [x] Task 5.1 CRXJS + Vite 脚手架（MV3 manifest + React + Tailwind）
- [x] Task 5.2 消息通信协议（类型安全消息 + correlationId）
- [x] Task 5.3 本地存储封装（Dexie IndexedDB + LRU 清理）

## 改动文件列表

```
apps/extension/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── manifest.json                         # Chrome MV3 manifest
├── tailwind.config.js                    # seed green + soil brown
├── postcss.config.js
├── icons/
│   ├── generate-icons.ts                 # PNG 生成脚本
│   ├── 16.png / 48.png / 128.png
├── src/
│   ├── vite-env.d.ts
│   ├── styles/globals.css                # Tailwind directives
│   ├── shared/
│   │   ├── messages.ts                   # 7 种消息类型定义
│   │   ├── messaging.ts                  # sendMessage + correlationId
│   │   ├── db.ts                         # Dexie DB + LRU
│   │   └── messages.test.ts              # 消息测试
│   ├── service-worker/
│   │   └── index.ts                      # SW: 图标点击→打开 Side Panel
│   ├── content-script/
│   │   └── index.ts                      # CS: 监听 CAPTURE_PAGE
│   ├── side-panel/
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── App.tsx                       # Hello World
│   └── options/
│       ├── index.html
│       ├── index.tsx
│       └── App.tsx                       # Hello World
```

## 验收清单勾选情况
- [x] 插件能构建（dist/ 产出完整，~300KB）
- [x] Chrome 开发者模式可加载（manifest.json 格式正确）
- [x] Side Panel HTML 入口就位
- [x] 三组件间消息通信类型定义完整
- [x] IndexedDB 封装可读写
- [x] 图标自动生成（prebuild 钩子）

## 已知问题 / 潜在风险
- @crxjs/vite-plugin@beta 标记为 deprecated，但仍是 MV3 最佳构建方案
- 图标是纯色占位，上线前需要替换为正式设计

## 关键决策记录
- 使用 pngjs 而非 canvas 生成占位图标，避免 Windows 上的原生编译问题
- React 18 而非 19，与当前工具链稳定兼容
- Tailwind 自定义 seed/soil 色板，对齐 PRD §8.3 视觉规范
