# NoteSeed Skills 指南

## 概述

Skills 是 NoteSeed 的核心智能层，由 5 个可组合技能组成，通过 Orchestrator 编排执行。

## 自定义 AI 提供者

NoteSeed 支持两种 API 协议，用户可自行接入任意兼容的大模型服务：

### Anthropic 协议

兼容 Anthropic Messages API，使用 `tool_use` 获取结构化输出。

- Anthropic 官方（Claude 系列）
- 任何兼容 Anthropic API 的第三方服务

### OpenAI 协议

兼容 OpenAI Chat Completions API，使用 `function calling` 获取结构化输出。

- OpenAI 官方（GPT 系列）
- DeepSeek
- Moonshot（月之暗面）
- 智谱 GLM
- 通义千问
- Ollama（本地模型）
- vLLM / LM Studio
- Azure OpenAI
- 其他 OpenAI 兼容端点

### 模型角色

每个提供者需配置两个模型角色：

| 角色 | 用途 | 要求 |
|------|------|------|
| **fast** | 分类、标签、元数据补全 | 响应快、成本低 |
| **powerful** | 内容蒸馏提取 | 理解能力强 |

### 配置方式

1. **扩展设置页** → AI 模型 tab → 选择预设或自定义
2. **环境变量** → `ANTHROPIC_API_KEY`（服务器默认回退）

## PageSense — 页面分类

**模型角色**: fast
**输入**: cleanText, url, title, metadata
**输出**: pageType, confidence, suggestedTemplate

### 页面类型

| 类型 | 说明 | 示例 |
|------|------|------|
| tutorial | 教程/指南 | MDN, 博客教程 |
| opinion | 观点/评论 | 专栏文章 |
| news | 新闻/资讯 | 科技新闻 |
| doc | 文档/API | GitHub README |
| tool | 工具/产品页 | SaaS 产品页 |
| resource | 资源列表 | Awesome 列表 |
| longform | 长篇深度文 | 万字研究 |
| discussion | 讨论/问答 | HN, Reddit |

### 启发式信号

PageSense 先执行三种非 AI 检测：
1. **域名匹配** — `github.com` → doc, `news.ycombinator.com` → discussion
2. **DOM 结构** — `<code>` 块多 → tutorial/doc, `<blockquote>` 多 → opinion
3. **关键词** — "step 1/2/3" → tutorial, "I think" → opinion

信号置信度 ≥ 0.8 时直接返回，不调 LLM。

### Prompt 调优要点

- system prompt 包含 8 种类型的定义和判断标准
- 使用 tool_use / function calling 保证返回结构化 JSON
- temperature = 0，确保一致性

## Contextualizer — 元数据补全

**模型角色**: fast
**输入**: PageSource (完整页面数据)
**输出**: author, publishedAt, language, readingTime

### 本地检测

- 阅读时间：中文 300 字/分钟，英文 200 词/分钟
- 语言检测：基于 Unicode 范围（CJK → zh, Latin → en）

### LLM 补全

仅当 OG/meta/JSON-LD 未能提取到 author 或 publishedAt 时调用 LLM。

## Distiller — 内容提取

**模型角色**: powerful
**输入**: cleanText, title, pageType
**输出**: summary, keyPoints, 及类型特定字段

### 按类型分 Prompt

每种页面类型有独立的 prompt 模块：
- **tutorial**: 提取 steps, prerequisites, techStack
- **opinion**: 提取 mainArgument, evidence, counterPoints
- **news**: 提取 who, what, when, where, impact
- **doc**: 提取 purpose, apiSurface, requirements
- **generic**: 通用提取

### 调优指南

- 包含 few-shot 示例提升输出质量
- 每个 prompt 限制输出 token ≤ 2048

## Tagger — 标签生成

**模型角色**: fast
**输入**: summary, keyPoints, userTagHistory
**输出**: tags (3-5), category, topic

### 标签策略

- 基于 summary 和 keyPoints 生成 3-5 个标签
- 参考 userTagHistory 保持标签体系一致性
- category 是宽泛分类（如 "技术"、"商业"、"设计"）
- topic 是具体主题（如 "React Hooks"、"容器化"）

## Cardwright — 模板渲染

**无 LLM**：纯 TypeScript 字符串模板
**输入**: CardAnalysis, title, url, author, publishedAt
**输出**: markdown, plainText, wordCount

### 模板

每种 pageType 有对应模板，优雅处理缺失字段：
- 标题 + 来源 URL
- 摘要
- 类型特定内容（步骤/论点/5W1H...）
- 标签
- 元数据（作者/日期）

### Compact 模式

目标为 Memos 时截断至 ~1500 字符。

## Orchestrator — 编排

`generateCard(source, options)` 按序执行 5 个 Skill：

```
PageSense → Contextualizer → Distiller → Tagger → Cardwright
```

当 `options.aiProvider` 存在时，管线使用用户自定义的 AI 提供者；否则回退到环境变量配置。

每步用 `timed()` 包装计时。任一步骤失败不阻塞后续步骤（降级到默认值）。

返回 `{ card: KnowledgeCard, timings: PipelineTimings }`。
