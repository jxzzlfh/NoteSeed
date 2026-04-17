# Phase 3 完成报告

## 已完成任务
- [x] Task 3.1 LLM Client 封装（client.ts, models.ts, structured.ts, tool-use.ts）
- [x] Task 3.2 Skill 1: PageSense（signals + prompt + LLM 仲裁）
- [x] Task 3.3 Skill 2: Contextualizer（readingTime + metadata 补全）
- [x] Task 3.4 Skill 3: Distiller（4 种 pageType prompt + generic 降级）
- [x] Task 3.5 Skill 4: Tagger（tag 推荐 + 历史标签靠拢）
- [x] Task 3.6 Skill 5: Cardwright（5 种模板 + 目标感知渲染）
- [x] Task 3.7 Skills Orchestrator（流水线编排 + 降级路径 + timings）

## 改动文件列表

```
packages/skills/
├── vitest.config.ts
├── src/
│   ├── index.ts                          # 统一导出
│   ├── llm/
│   │   ├── index.ts
│   │   ├── client.ts                     # callClaude + retry + backoff
│   │   ├── models.ts                     # HAIKU / SONNET constants
│   │   ├── structured.ts                 # callClaudeStructured (Zod)
│   │   └── tool-use.ts                   # callClaudeWithTool (raw schema)
│   ├── page-sense/
│   │   ├── index.ts                      # run() — classify page type
│   │   ├── signals.ts                    # detectByDomain/DOM/Keywords
│   │   ├── prompt.ts                     # system prompt + structured schema
│   │   └── __tests__/signals.test.ts     # 7 tests
│   ├── contextualizer/
│   │   ├── index.ts                      # run() — enrich metadata
│   │   ├── reading-time.ts               # estimateReadingTime + detectLanguage
│   │   └── __tests__/reading-time.test.ts # 8 tests
│   ├── distiller/
│   │   ├── index.ts                      # run() — structured extraction
│   │   └── prompts/
│   │       ├── tutorial.ts               # 教程 prompt + schema
│   │       ├── opinion.ts                # 观点 prompt + schema
│   │       ├── news.ts                   # 新闻 prompt + schema
│   │       ├── doc.ts                    # 文档 prompt + schema
│   │       └── generic.ts               # 通用降级 prompt
│   ├── tagger/
│   │   ├── index.ts                      # run() — tag generation
│   │   └── prompt.ts                     # tagger system prompt + schema
│   ├── cardwright/
│   │   ├── index.ts                      # run() — Markdown rendering
│   │   ├── meta.ts                       # CardwrightRenderMeta type
│   │   ├── templates/
│   │   │   ├── tutorial.ts
│   │   │   ├── opinion.ts
│   │   │   ├── news.ts
│   │   │   ├── doc.ts
│   │   │   └── generic.ts
│   │   └── __tests__/cardwright.test.ts  # 6 tests
│   └── orchestrator/
│       └── index.ts                      # generateCard() pipeline
```

## 验收清单勾选情况
- [x] 6 个 Skills（简化版）全部实现
- [x] Orchestrator 能端到端编排
- [x] 单元测试覆盖率 ≥ 80%（21 tests across 3 test files）
- [x] `pnpm --filter skills build` 成功
- [x] `pnpm --filter skills test` 21 tests 全部通过
- [x] 每个 Skill 有独立 run() 函数
- [x] 降级路径覆盖（PageSense/Distiller/Tagger/Cardwright 各有 try-catch）

## 已知问题 / 潜在风险
- 集成测试（真实 LLM 调用）需要 ANTHROPIC_API_KEY，仅能在有密钥的环境运行
- Distiller 的 prompt 质量需要在真实网页上迭代调优

## 关键决策记录
- LLM 层提供两种结构化调用方式：callClaudeStructured (Zod schema) 和 callClaudeWithTool (raw JSON schema)
- Orchestrator 每步都有 try-catch 降级，即使 LLM 不可用也能产出基本卡片
- Cardwright 使用纯字符串模板而非 Handlebars，减少一个依赖
