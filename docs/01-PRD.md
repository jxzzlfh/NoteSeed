# NoteSeed 产品需求文档（PRD）

> **一句话定位**：NoteSeed 是一款浏览器插件，把任意网页一键"种"成一张结构化知识卡片，再顺手种进你已有的知识系统（Memos / Get 笔记 / 金山文档 / 飞书）。
>
> **Slogan**：Seed the web into your second brain.
>
> **版本**：v1.0（MVP 冻结版）
> **文档状态**：终审稿
> **最后更新**：2026-04-16

---

## 目录

1. 产品概述
2. 目标用户与使用场景
3. 竞品与差异化
4. 产品形态：浏览器插件
5. 功能架构总览
6. Skills 技能体系（核心章节）
7. 详细功能需求
8. 交互与 UI 规范
9. 数据协议与数据模型
10. 接口设计
11. 非功能性需求
12. 里程碑与 MVP 范围
13. 风险与应对
14. 成功指标

---

## 1. 产品概述

### 1.1 产品名称

**NoteSeed**（中文副名：种笔记）

名称释义：Note + Seed。每一张网页都是一粒"种子"，NoteSeed 帮你把种子埋进知识系统，让它在未来真的发芽——而不是死在收藏夹里。

### 1.2 产品定位

面向个人知识工作者的**"网页→卡片→知识系统"**一站式采集工具。以浏览器插件为唯一载体，以 Skills 为核心引擎，把网页内容自动识别、结构化提炼、生成 Markdown 卡片，并直接写入用户已有的笔记系统。

### 1.3 产品愿景

让"浏览网页"这一行为不再止步于"收藏"或"划过"，而是直接沉淀为可检索、可复用、可组合的知识资产。

NoteSeed 不做笔记系统本身，只做**知识入口的最后一公里**。

### 1.4 核心价值主张

| 维度 | 传统方式 | NoteSeed |
|---|---|---|
| 采集成本 | 复制 + 粘贴 + 手工整理 ≈ 3~5 分钟 | 点一下 ≈ 10 秒 |
| 输出质量 | 原始长文、格式混乱 | 结构化 Markdown 卡片 |
| 内容策略 | 一刀切保存 | 按页面类型智能提炼 |
| 归宿 | 收藏夹吃灰 | 直达你现有笔记系统 |
| 长期价值 | 链接墓地 | 可复用知识库 |

### 1.5 产品哲学（三条红线）

1. **不做笔记系统的竞争者，做它们的入口**。用户已有的知识系统（Memos 等）是被尊重的"主干"，NoteSeed 只是连通主干的"根须"。
2. **Skills 优先，大模型其次**。业务价值由 Skills 的组合决定，模型只是执行器。换模型不应影响产品行为。
3. **10 秒原则**。从点击到卡片生成完成，中位耗时必须 ≤ 10 秒。任何功能若破坏这一节奏，延后做或不做。

---

## 2. 目标用户与使用场景

### 2.1 用户画像

**核心用户**：重度信息消费者 + 已有笔记系统的人。

- **知识工作者**（产品、设计、研究、咨询）：每天读大量网页，需要沉淀成可检索的资料库。
- **开发者 / 学习者**：经常看技术教程、API 文档，希望保存成"步骤卡"方便后续查阅。
- **内容创作者**：观点文、长文读者，需要提炼金句、论点用于二次创作。
- **自建知识库玩家**：Memos、Get 笔记的深度用户，追求采集自动化。

**画像关键特征**：
- 已有固定笔记系统，不打算换
- 对 Markdown 无障碍
- 愿意为"每次节省 3 分钟 × 每天 5 次 × 一年"付费
- 对"数据在自己手里"有强诉求

### 2.2 典型使用场景

| 场景 | 页面类型 | 期望输出 | 归宿 |
|---|---|---|---|
| 读到一篇 Next.js 教程 | tutorial | 步骤卡（目标/前置/步骤/注意） | Memos |
| 读到一篇行业观点长文 | opinion | 论点卡（核心观点/论据/金句） | 飞书文档 |
| 查阅官方 API 文档 | doc | 参数卡（接口/参数/示例） | Get 笔记 |
| 看到一条行业新闻 | news | 事实卡（5W1H/要点/标签） | Memos |
| 团队资料调研 | resource | 摘要卡（描述/亮点/链接） | 金山文档 |

### 2.3 用户痛点（NoteSeed 要解决的）

1. **收藏焦虑**：收藏夹越囤越多，实际回看率＜5%。
2. **摘录太累**：手工复制、排版、打标签、写摘要，做一次要 3~5 分钟。
3. **一刀切保存**：教程、观点、文档需要的结构完全不同，但所有工具都用一个模板。
4. **笔记系统割裂**：已有的 Memos / 飞书 / 金山，各自是孤岛，缺少一个统一"入口"。
5. **格式污染**：直接复制粘贴带来的样式、脚注、广告残留。

### 2.4 NoteSeed 不解决什么（Non-Goals）

首版明确**不做**以下能力，避免摊薄主价值：
- 团队协作、权限管理
- 卡片的知识图谱、双链
- 自建云端笔记库（NoteSeed 不是 Evernote 替代品）
- 全平台客户端（桌面/移动端）
- 多人共享编辑
- AI 对话、Agent 任务

---

## 3. 竞品与差异化

| 产品 | 核心能力 | NoteSeed 差异 |
|---|---|---|
| Pocket / Instapaper | 稍后读，原文保存 | NoteSeed 不保留原文，只保留结构化卡片 |
| Notion Web Clipper | 裁剪网页到 Notion | NoteSeed 按页面类型差异化提炼，且不绑定 Notion |
| Readwise | 高亮同步 | NoteSeed 不依赖高亮，全页自动提炼 |
| 飞书剪存 | 剪存到飞书 | NoteSeed 多目的地 + Skills 可扩展 |
| Heptabase / Logseq | 重型卡片笔记 | NoteSeed 是"入口"而非"笔记库"本身 |

**NoteSeed 的护城河**：Skills 体系 + 多笔记系统适配器 + 10 秒交付节奏。

---

## 4. 产品形态：浏览器插件

### 4.1 形态定位

NoteSeed 是一个**纯浏览器插件**，首发支持 **Chrome / Edge**（基于 Manifest V3），后续扩展至 Firefox、Arc、Safari。

不做 Web 版、不做桌面端、不做 App。所有操作在浏览器内完成。

### 4.2 为什么是插件

| 选项 | 优势 | 劣势 | 结论 |
|---|---|---|---|
| Web 应用 | 部署快 | 用户要复制 URL 粘贴，增加一步 | ❌ |
| 桌面端 | 稳定 | 和"浏览网页"场景脱节 | ❌ |
| **浏览器插件** | **紧贴场景，零摩擦** | 开发约束多 | ✅ |
| Bookmarklet | 极轻 | 能力受限，无侧边栏 | ❌ |

**插件是唯一能做到"读到立刻转"的形态**。

### 4.3 插件组成

| 模块 | 技术载体 | 职责 |
|---|---|---|
| **Side Panel** | Chrome Side Panel API | 主交互面板，展示卡片、预览、保存 |
| **Content Script** | 注入页面 | 采集正文、高亮、元信息 |
| **Service Worker** | 后台脚本 | 调度 Skills、管理会话 |
| **Options Page** | 独立页面 | 设置中心（默认模板、目标系统、API Key） |
| **Popup**（可选） | 极简 | 仅作为快捷入口，点击后打开 Side Panel |

### 4.4 核心交互流

```
在网页上 → 点击 NoteSeed 图标
        ↓
      Side Panel 展开
        ↓
  自动采集页面（Content Script）
        ↓
    自动识别页面类型（Skill A）
        ↓
      展示"推荐模板"
        ↓
   用户点【一键制卡】
        ↓
   Skills 流水线执行
        ↓
    卡片预览 + 轻编辑
        ↓
      选择保存目标
        ↓
        完成
```

### 4.5 权限清单（Manifest V3）

```
"permissions": ["activeTab", "sidePanel", "storage", "scripting"],
"host_permissions": ["<all_urls>"],
"content_scripts": [{ "matches": ["<all_urls>"] }],
"action": { "default_title": "NoteSeed" }
```

**隐私承诺**：
- 插件仅在用户主动点击时采集当前页
- 不做全量浏览历史收集
- 所有 API Key 本地加密存储
- 支持完全离线模式（配合本地 LLM，后续版本）

---

## 5. 功能架构总览

```
NoteSeed
├── 1. 采集层（Capture）
│   ├── 1.1 正文提取（智能去噪）
│   ├── 1.2 元信息抽取（标题/作者/时间/域名）
│   ├── 1.3 选区模式（仅处理用户选中文本）
│   └── 1.4 多页拼接（长文分页自动合并）
│
├── 2. 理解层（Understanding）← Skills 核心
│   ├── 2.1 页面类型识别
│   ├── 2.2 内容结构分析
│   └── 2.3 提炼策略路由
│
├── 3. 生成层（Generation）← Skills 核心
│   ├── 3.1 摘要生成
│   ├── 3.2 结构化提炼（要点/步骤/金句/事实）
│   ├── 3.3 标签推荐
│   └── 3.4 Markdown 渲染
│
├── 4. 编辑层（Edit）
│   ├── 4.1 卡片预览
│   ├── 4.2 字段微调
│   ├── 4.3 模板切换
│   └── 4.4 Markdown 源码编辑
│
├── 5. 分发层（Distribute）← Skills 核心
│   ├── 5.1 复制 / 下载
│   ├── 5.2 Memos 适配器
│   ├── 5.3 飞书适配器
│   ├── 5.4 Get 笔记适配器
│   └── 5.5 金山文档适配器
│
└── 6. 设置与管理（Settings）
    ├── 6.1 默认模板、默认目的地
    ├── 6.2 Skills 开关与参数
    ├── 6.3 账号与 API Key 管理
    └── 6.4 本地历史卡片（最近 100 张）
```

---

## 6. Skills 技能体系（核心章节）

### 6.1 Skills 设计哲学

NoteSeed 的差异化不在 UI、不在模型，而在 **Skills 的分工与组合**。

**三条设计原则**：

1. **单一职责**：每个 Skill 只做一件事，输入输出明确。
2. **可插拔**：Skill 可独立升级、替换、关停，不影响其他 Skill。
3. **可组合**：Skills 之间通过统一数据协议（KnowledgeCard v1）串联，形成流水线。

### 6.2 Skills 全景图

NoteSeed 共内置 **8 个 Skills**，分三层：

```
┌─────────────────────────────────────────────────────────┐
│                    🌱 Seed Layer 种子层                   │
│  Skill 1: PageSense    Skill 2: Contextualizer          │
│  （感知页面）           （上下文补全）                     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 🌿 Grow Layer 生长层                     │
│  Skill 3: Distiller     Skill 4: Tagger                 │
│  （精华提炼）            （标签推荐）                      │
│  Skill 5: Cardwright    Skill 6: StyleMatcher           │
│  （卡片成型）            （风格匹配）                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 🌳 Root Layer 扎根层                     │
│  Skill 7: Dispatcher    Skill 8: Chronicle              │
│  （目的地分发）          （历史沉淀）                       │
└─────────────────────────────────────────────────────────┘
```

### 6.3 各 Skill 详细说明

---

#### 🌱 Skill 1：**PageSense**（页面感知）

**一句话**：判断这是一张什么类型的"种子"。

**职责**：
识别当前网页的语义类型，决定后续流水线走哪条分支。

**输入**：
```json
{
  "url": "https://...",
  "title": "...",
  "rawHTML": "<html>...</html>",
  "cleanText": "去噪后的正文",
  "metadata": { "author": "...", "publishedAt": "...", "siteName": "..." }
}
```

**输出**：
```json
{
  "pageType": "tutorial | opinion | news | doc | tool | resource | longform | discussion",
  "confidence": 0.92,
  "suggestedTemplate": "tutorial-v1",
  "signals": ["含'步骤'字样", "包含代码块", "有序列表>5"]
}
```

**创意亮点**：
- **多信号融合识别**：不只靠 LLM 分类，而是融合"DOM 结构 + 域名特征 + 文本信号 + URL 模式"四类证据，再用 LLM 做最终仲裁。例如 `github.com/*/README.md` 直接判定为 doc，`zhihu.com/question/*` 判定为 discussion。
- **信心值透明**：confidence < 0.6 时，Side Panel 会展示"识别结果：教程（65%），可能是文档（30%）"，让用户手动切换。
- **8 种页面类型**：tutorial / opinion / news / doc / tool / resource / longform / discussion。每种对应一套独立的提炼策略。

**为什么重要**：
传统剪藏工具对所有页面用同一模板，这是错误的起点。PageSense 让 NoteSeed 从第一步就开始区别对待。

---

#### 🌱 Skill 2：**Contextualizer**（上下文补全）

**一句话**：为种子补齐水土信息。

**职责**：
补全网页原始上下文缺失的信息，让卡片"离开网页也能看懂"。

**输入**：PageSense 的输出 + 原始页面文本。

**输出**：
```json
{
  "author": "张三 (来自 bio 段落推断)",
  "publishedAt": "2025-09-12（从正文首段提取）",
  "language": "zh-CN",
  "readingTime": "约 8 分钟",
  "sourceCredibility": "medium",
  "relatedSeriesTitle": "React 18 深入系列（第 3 篇）"
}
```

**创意亮点**：
- **"脱离网页可读"检测**：Contextualizer 会检查卡片内容中是否存在"本文"、"上一节"、"如前所述"等需要原文上下文才能理解的代词，自动替换成具体指代。
- **系列文识别**：若页面是系列文章的一篇，自动识别系列标题，未来可在 Chronicle 中聚合为系列卡包。
- **来源可信度**：基于域名白名单 + 作者署名 + 发布时间，给出一个可信度等级，影响卡片的"提醒用户二次核查"标记。

**为什么重要**：
知识卡片的最大敌人是"半年后再看不懂自己存的什么"。Contextualizer 在生成阶段就预防这个问题。

---

#### 🌿 Skill 3：**Distiller**（精华提炼）

**一句话**：把一大片网页熬成一小勺精华。

**职责**：
根据 PageSense 识别的页面类型，调用对应的提炼策略，产出结构化内容字段。

**输入**：pageType + cleanText + contextInfo。

**输出（按类型差异化）**：

| 页面类型 | 核心字段 |
|---|---|
| tutorial | `summary / prerequisites[] / steps[] / warnings[]` |
| opinion | `summary / keyPoints[] / quotes[] / counterArguments[]` |
| news | `summary / whoWhatWhenWhere / keyFacts[]` |
| doc | `summary / apiSignature / params[] / examples[]` |
| tool | `summary / useCase / pros[] / cons[] / pricing` |
| resource | `summary / description / highlights[] / bestFor` |
| longform | `summary / outline[] / keyInsights[]` |
| discussion | `question / topAnswers[] / consensus / controversy` |

**创意亮点**：
- **类型专属 Prompt 库**：每种页面类型有一套手工打磨的 Prompt 模板，不是通用摘要。教程提"步骤"、观点提"论点与反驳"、文档提"参数"，这是 NoteSeed 的核心壁垒。
- **保留度可调**：用户可在设置中选择"极简 / 标准 / 详实"三档保留度，对应不同的字段深度和数量。
- **事实与观点分离**：对于新闻和观点文，Distiller 会区分"事实陈述"与"作者观点"两类内容，分别打标，避免用户误把观点当事实。
- **引用可溯源**：每一条提炼出的 keyPoint 都带有 `sourceSpan`（原文锚定区间），点击可跳回原文高亮。

**为什么重要**：
这是 NoteSeed "值钱"的地方。别的工具做摘要，NoteSeed 做**结构化提炼**。

---

#### 🌿 Skill 4：**Tagger**（智能标签）

**一句话**：让这张卡未来能被检索到。

**职责**：
为卡片推荐 3~5 个标签，兼顾通用性和个人化。

**输入**：Distiller 输出 + 用户历史标签库。

**输出**：
```json
{
  "tags": ["#前端", "#React", "#Hook", "#性能优化"],
  "category": "技术/前端",
  "topic": "React 性能优化",
  "noveltyScore": 0.7
}
```

**创意亮点**：
- **向既有标签靠拢**：Tagger 读取用户笔记系统（Memos / 飞书）中的历史标签，优先复用，而不是每次生成新标签。避免"#React"、"#react"、"#reactjs"三个标签并存的混乱。
- **个人标签词典**：首次使用会引导用户导入一批"常用标签"，Tagger 优先在这个词典内推荐。
- **新颖度评分 noveltyScore**：当一张卡的内容与用户已有卡片重合度高时，noveltyScore 低，UI 会提示"你 2 周前存过类似内容"，避免重复囤积。
- **层级标签**：支持 `#技术/前端/React` 这种层级结构，方便后续在笔记系统里做树形组织。

**为什么重要**：
卡片存下来如果搜不到，和没存一样。Tagger 决定了卡片的未来可检索性。

---

#### 🌿 Skill 5：**Cardwright**（卡片铸造）

**一句话**：把零件拼成一张端正的卡。

**职责**：
根据模板和 Distiller 的结构化字段，渲染出最终的 Markdown 卡片。

**输入**：CardAnalysis（含 pageType / fields / tags） + template。

**输出**：
```json
{
  "markdown": "# 标题\n\n## 摘要\n...",
  "plainText": "标题\n\n摘要\n...",
  "wordCount": 412,
  "estimatedMemosLength": 980
}
```

**创意亮点**：
- **多模板引擎**：内置 8 种默认模板（对应 8 种 pageType），每种模板支持变体（如教程模板有"步骤型"和"概念型"两个变体）。
- **用户自定义模板**：高级用户可通过 Mustache 语法自定义模板，上传后成为个人模板库。
- **目标感知渲染**：Cardwright 知道这张卡最终要去 Memos（字数受限、偏口语）还是飞书（支持富格式、可长），渲染时自动调整风格。
- **多样态产出**：同一张卡可同时产出 `markdown`、`plainText`、`compactVersion`（压缩到 300 字以内）三种格式。

**为什么重要**：
卡片的"可读性"和"可复用性"取决于渲染质量。Cardwright 是用户感知中的"颜值担当"。

---

#### 🌿 Skill 6：**StyleMatcher**（风格匹配）【创新亮点】

**一句话**：让 NoteSeed 生成的卡片"看起来就是你写的"。

**职责**：
学习用户历史笔记的写作风格（句长、用词、是否用 emoji、是否用问句开头等），让生成的卡片融入用户原有笔记库，不突兀。

**输入**：用户最近 30 张历史卡 + 当前 Cardwright 产出。

**输出**：风格调整后的 Markdown。

**创意亮点**：
- **首次启用时做风格采样**：NoteSeed 会读取用户 Memos 里最近 30 条笔记，生成一份 `userStyleProfile`（本地存储）：
  - 平均句长
  - 标题层级偏好（h2 还是 h3）
  - 是否使用 emoji
  - 是否使用"我认为 / 本文讲"等开场
  - 是否使用引用块
- **"像自己写的"开关**：用户可在设置中一键开启/关闭。关闭则回归中立风格。
- **这是 NoteSeed 区别于所有剪藏工具的独特点**——别的工具都是"把网页内容塞给你"，NoteSeed 是"以你的口吻讲给你听"。

**为什么重要**：
笔记系统的连贯性一旦被破坏（突然冒出一堆机器腔调的剪藏），用户就会放弃。StyleMatcher 解决这个问题。

---

#### 🌳 Skill 7：**Dispatcher**（目的地分发）

**一句话**：把卡种到对的土里。

**职责**：
统一对接多个笔记系统，把 KnowledgeCard 翻译成各目标系统的原生格式并保存。

**输入**：KnowledgeCard + SaveRequest（含 target 字段）。

**输出**：
```json
{
  "success": true,
  "target": "memos",
  "targetRef": "memo_123456",
  "targetUrl": "https://memos.example.com/m/123456",
  "savedAt": "2026-04-16T10:23:00Z"
}
```

**架构**：Dispatcher 本身是调度层，下挂 4 个 Adapter：

| Adapter | 目标 | 默认模式 | 特殊处理 |
|---|---|---|---|
| MemosAdapter | Memos | compact（1500 字内） | 标签拼到正文末尾；默认 private |
| FeishuAdapter | 飞书文档 | full_markdown | 自动建立在指定文件夹；支持富文本 |
| GetAdapter | Get 笔记 | standard | 映射 Get 笔记的"笔记本"概念 |
| KSDocAdapter | 金山文档 | full_markdown | 使用金山 Markdown 模式 |

**创意亮点**：
- **统一协议 KnowledgeCard v1**：所有 Adapter 消费同一份数据结构，新增一个目标只需写 Adapter，不影响上游。
- **同时分发**：用户可勾选"同时保存到 Memos + 飞书"，Dispatcher 并发执行，部分失败不影响整体。
- **失败重试 + 本地暂存**：若目标系统临时不可达，卡片会本地暂存，下次上线时自动补发。
- **目的地推荐**：Dispatcher 会根据 pageType 推荐默认目的地（教程默认 Memos、观点默认飞书），用户一次选择后记住。

**为什么重要**：
Dispatcher 是 NoteSeed 从"AI 演示品"升级为"工作流工具"的关键。没有它，就只是又一个 AI 摘要器。

---

#### 🌳 Skill 8：**Chronicle**（历史沉淀）

**一句话**：记住每一颗种过的种子。

**职责**：
管理本地历史卡片、去重、聚合。

**输入**：每次生成的 KnowledgeCard。

**输出**：本地索引 + 去重建议 + 系列聚合。

**创意亮点**：
- **本地优先**：最近 100 张卡片存于浏览器本地（IndexedDB），不依赖云端，隐私友好。
- **去重提醒**：基于 URL + 内容指纹，若用户试图重复保存同一篇，提示"你 3 天前存过，是否覆盖？"。
- **系列聚合**：若 Contextualizer 识别出当前卡属于某系列（如"React 18 深入系列"），Chronicle 自动在本地聚合，用户可一键生成"系列汇总卡"。
- **回看热力图**：侧边栏底部展示最近 30 天的制卡活动热力图，强化"知识积累感"。
- **本周回顾**：每周五弹出本周制卡摘要，促进回看，打破"存完就忘"的怪圈。

**为什么重要**：
Chronicle 把 NoteSeed 从"一次性工具"升级为"有记忆的助手"。用户每次制卡都在积累数据，NoteSeed 反过来又用这些数据变得更懂用户（喂给 StyleMatcher 和 Tagger）。

### 6.4 Skills 协同流程图

```
用户点击【一键制卡】
        │
        ▼
┌──────────────────┐
│  PageSense       │ ← 页面类型识别
└────────┬─────────┘
         ▼
┌──────────────────┐
│  Contextualizer  │ ← 上下文补全（并行于下一步）
└────────┬─────────┘
         ▼
┌──────────────────┐
│  Distiller       │ ← 按类型结构化提炼
└────────┬─────────┘
         │
         ├──────────┐
         ▼          ▼
    ┌────────┐  ┌────────┐
    │Tagger  │  │Cardwright│
    └────┬───┘  └────┬────┘
         └──────┬────┘
                ▼
         ┌──────────────┐
         │ StyleMatcher │ ← 可选，用户开启
         └──────┬───────┘
                ▼
         【卡片预览】
                │
         用户点【保存】
                ▼
         ┌──────────────┐
         │  Dispatcher  │ ← 并发写入多个目的地
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │  Chronicle   │ ← 本地记录 + 去重
         └──────────────┘
```

### 6.5 Skills 能力矩阵总览

| # | Skill | 层 | 是否可关闭 | 是否可替换 | MVP | 创新等级 |
|---|---|---|---|---|---|---|
| 1 | PageSense | 种子 | 否 | 是 | ✅ | ⭐⭐⭐ |
| 2 | Contextualizer | 种子 | 是 | 是 | ✅ | ⭐⭐⭐⭐ |
| 3 | Distiller | 生长 | 否 | 是 | ✅ | ⭐⭐⭐⭐⭐ |
| 4 | Tagger | 生长 | 是 | 是 | ✅ | ⭐⭐⭐ |
| 5 | Cardwright | 生长 | 否 | 是 | ✅ | ⭐⭐⭐ |
| 6 | StyleMatcher | 生长 | 是 | 否 | ⏳ v1.1 | ⭐⭐⭐⭐⭐ |
| 7 | Dispatcher | 扎根 | 否 | 是 | ✅ | ⭐⭐⭐⭐ |
| 8 | Chronicle | 扎根 | 是 | 否 | ⏳ v1.1 | ⭐⭐⭐⭐ |

---

## 7. 详细功能需求

### 7.1 采集层

| ID | 需求 | 优先级 |
|---|---|---|
| F1.1 | 支持一键采集当前页面正文、标题、URL | P0 |
| F1.2 | 智能去噪：剔除广告、侧边栏、评论区 | P0 |
| F1.3 | 选区模式：用户若选中文本，仅处理选中部分 | P0 |
| F1.4 | 多页拼接：识别"下一页"按钮，自动合并长文 | P1 |
| F1.5 | 图片处理：提取图片 URL，保留在 Markdown | P1 |
| F1.6 | 代码块保留：识别 `<pre><code>` 并保持格式 | P0 |

### 7.2 理解与生成层

| ID | 需求 | 优先级 |
|---|---|---|
| F2.1 | 自动识别 8 种页面类型，给出 confidence | P0 |
| F2.2 | 用户可手动切换页面类型 | P0 |
| F2.3 | 按类型差异化提炼（Distiller） | P0 |
| F2.4 | 生成 3~5 个标签，向用户历史标签靠拢 | P0 |
| F2.5 | 支持"极简/标准/详实"三档内容保留度 | P1 |
| F2.6 | 引用溯源：提炼点可跳回原文高亮 | P2 |
| F2.7 | 风格匹配（StyleMatcher） | P1（v1.1） |

### 7.3 编辑层

| ID | 需求 | 优先级 |
|---|---|---|
| F3.1 | 卡片预览区支持实时 Markdown 渲染 | P0 |
| F3.2 | 标题、摘要、标签可直接编辑 | P0 |
| F3.3 | 模板切换（同类型下切换变体） | P1 |
| F3.4 | Markdown 源码编辑模式 | P0 |
| F3.5 | 撤销重做（最多 10 步） | P1 |

### 7.4 分发层

| ID | 需求 | 优先级 |
|---|---|---|
| F4.1 | 复制 Markdown 到剪贴板 | P0 |
| F4.2 | 下载 .md 文件 | P0 |
| F4.3 | 保存到 Memos | P0 |
| F4.4 | 保存到 飞书 | P0 |
| F4.5 | 保存到 Get 笔记 | P1 |
| F4.6 | 保存到 金山文档 | P1 |
| F4.7 | 同时保存到多个目的地 | P1 |
| F4.8 | 失败重试 + 本地暂存 | P1 |

### 7.5 设置

| ID | 需求 | 优先级 |
|---|---|---|
| F5.1 | 默认模板、默认目的地 | P0 |
| F5.2 | Skills 开关（Tagger / StyleMatcher 等） | P1 |
| F5.3 | 笔记系统账号 / API Key 管理 | P0 |
| F5.4 | 历史卡片查看（本地最近 100 张） | P1 |
| F5.5 | 数据导出（JSON / Markdown） | P2 |

---

## 8. 交互与 UI 规范

### 8.1 Side Panel 布局

```
┌─────────────────────────────────┐
│ 🌱 NoteSeed   [教程] 🔄   ⚙   │ ← 顶部栏
├─────────────────────────────────┤
│ 标题：《React 性能优化实战》      │
│ 来源：juejin.cn · 张三 · 2025-9-12│ ← 页面信息
├─────────────────────────────────┤
│ [⚡ 一键制卡]  [↻ 重新识别]       │
│ 模板：教程卡 ▼                   │ ← 操作区
├─────────────────────────────────┤
│ ┌─ 预览 ───────────────────────┐ │
│ │ # React 性能优化实战           │ │
│ │                             │ │
│ │ ## 这篇讲什么                 │ │
│ │ 本文通过 3 个实战场景...        │ │
│ │                             │ │
│ │ ## 步骤                      │ │
│ │ 1. 用 useMemo 缓存...         │ │
│ │ 2. ...                      │ │
│ │                             │ │
│ │ ## 标签                      │ │ ← 卡片预览
│ │ #前端 #React #性能            │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ 保存到：                         │
│ ☑ Memos  ☐ 飞书  ☐ Get  ☐ 金山 │
│                                 │
│ [📋 复制]  [⬇ 下载]  [🚀 保存]   │ ← 分发区
└─────────────────────────────────┘
```

### 8.2 交互原则

- **10 秒节奏**：从点击图标到卡片生成完成，中位 ≤ 10 秒。
- **低打扰**：全程不弹模态框，所有反馈在 Side Panel 内完成。
- **渐进加载**：Skills 流水线分步展示进度（PageSense 完成 → Distiller 完成 → Cardwright 完成）。
- **失败优雅**：任何 Skill 失败，降级到上一步成功状态，不丢失用户进度。

### 8.3 视觉风格

- **主色**：种子绿 `#4A8B5C`（成长、自然）
- **辅色**：土壤棕 `#8B6F47`（沉淀、扎根）
- **字体**：Inter（英文）/ 思源黑体（中文）
- **图标**：基于"种子 🌱 / 生长 🌿 / 扎根 🌳"三阶段体系

---

## 9. 数据协议与数据模型

### 9.1 统一协议 KnowledgeCard v1

#### 9.1.1 PageSource

```typescript
interface PageSource {
  sourceId: string;         // uuid
  url: string;
  title: string;
  rawHTML?: string;
  cleanText: string;
  selectedText?: string;
  metadata: {
    siteName: string;
    author?: string;
    publishedAt?: string;   // ISO 8601
    language?: string;
  };
  collectedAt: string;       // ISO 8601
}
```

#### 9.1.2 CardAnalysis

```typescript
interface CardAnalysis {
  pageType: PageType;        // 8 种枚举之一
  confidence: number;        // 0~1
  summary: string;
  fields: {                  // 结构化字段，按 pageType 不同
    keyPoints?: string[];
    actionItems?: string[];
    steps?: string[];
    warnings?: string[];
    prerequisites?: string[];
    quotes?: string[];
    facts?: string[];
    params?: Array<{ name: string; type: string; desc: string }>;
    // ...
  };
  tags: string[];
  category?: string;
  suggestedTemplate: string;
  noveltyScore?: number;
}
```

#### 9.1.3 KnowledgeCard

```typescript
interface KnowledgeCard {
  id: string;                // uuid
  source: PageSource;
  analysis: CardAnalysis;
  markdown: string;
  plainText: string;
  status: 'draft' | 'saved' | 'failed';
  createdAt: string;
  updatedAt: string;
}
```

#### 9.1.4 SaveRequest / SaveResult

```typescript
interface SaveRequest {
  requestId: string;
  card: KnowledgeCard;
  targets: Array<'memos' | 'feishu' | 'get' | 'ksdoc'>;
  options?: {
    memos?: { visibility: 'private' | 'public'; renderMode: 'compact' | 'full' };
    feishu?: { folderToken?: string };
  };
}

interface SaveResult {
  requestId: string;
  results: Array<{
    target: string;
    success: boolean;
    targetRef?: string;
    targetUrl?: string;
    error?: string;
    savedAt: string;
  }>;
}
```

### 9.2 数据表（云端，仅用于登录用户的设置同步）

| 表名 | 用途 |
|---|---|
| `users` | 用户基本信息 |
| `user_settings` | 默认模板、目的地、Skills 开关 |
| `user_credentials` | 加密存储各笔记系统的 Token（AES-256） |
| `save_logs` | 保存操作日志（用于失败重试追踪） |

> ⚠️ **本地数据（不上传）**：
> - 本地卡片历史（IndexedDB，最近 100 张）
> - userStyleProfile（StyleMatcher 的个人风格档案）
> - 历史标签库缓存

---

## 10. 接口设计

### 10.1 核心 API

#### POST `/api/v1/cards/generate`

生成卡片（执行 Skill 1~6 的流水线）。

**Request**：
```json
{
  "source": { ... PageSource ... },
  "options": {
    "preferredTemplate": "auto",
    "retentionLevel": "standard",
    "enableStyleMatcher": true
  }
}
```

**Response**：
```json
{
  "card": { ... KnowledgeCard ... },
  "timings": {
    "pageSense_ms": 320,
    "distiller_ms": 4200,
    "cardwright_ms": 180,
    "total_ms": 5100
  }
}
```

#### POST `/api/v1/cards/save`

保存卡片到一个或多个目的地（执行 Skill 7）。

**Request / Response**：见 §9.1.4。

#### GET `/api/v1/cards/:id`

获取卡片详情。

#### PATCH `/api/v1/cards/:id`

更新卡片字段（用户编辑后同步）。

#### GET/PATCH `/api/v1/settings`

获取/更新用户设置。

#### POST `/api/v1/skills/style-profile`

上传用户历史笔记，生成 userStyleProfile（本地执行，不上传原文）。

### 10.2 错误码

| Code | 含义 |
|---|---|
| 4001 | 页面正文提取失败 |
| 4002 | 页面类型识别置信度过低 |
| 4003 | 目标系统未授权 |
| 4004 | 目标系统 API 限流 |
| 5001 | Skill 执行超时 |
| 5002 | 模型调用失败 |

---

## 11. 非功能性需求

### 11.1 性能

- 卡片生成端到端中位耗时 ≤ 10 秒（P50）
- P95 ≤ 20 秒
- Side Panel 冷启动 ≤ 500ms

### 11.2 可靠性

- Skills 流水线有明确降级路径（任一 Skill 失败不阻塞后续可降级的步骤）
- Dispatcher 失败自动本地暂存，24 小时内重试

### 11.3 隐私与安全

- 所有凭证本地加密（AES-256）
- 用户原始页面内容仅用于当次生成，不在服务端留存
- 支持"纯本地模式"（v1.2，配合 Ollama 等本地 LLM）
- GDPR / 中国个人信息保护法合规

### 11.4 兼容性

- Chrome ≥ 114（Side Panel API 要求）
- Edge ≥ 114
- Firefox（v1.1 支持）

### 11.5 可观测性

- 每个 Skill 有独立 metrics（耗时、成功率、降级率）
- 匿名错误上报（需用户明确同意）

---

## 12. 里程碑与 MVP 范围

### 12.1 MVP（v1.0）——首版上线

**时间**：立项后 10 周。

**包含 Skills**：
- ✅ PageSense
- ✅ Contextualizer（简化版，仅做作者/时间补全）
- ✅ Distiller（支持 4 种页面类型：tutorial / opinion / news / doc）
- ✅ Tagger
- ✅ Cardwright
- ✅ Dispatcher（Memos + 飞书）
- ⏳ StyleMatcher（不做）
- ⏳ Chronicle（简化版，仅本地列表）

**包含功能**：
- 插件安装、Side Panel、Options 页
- 一键制卡、预览、轻编辑
- 复制 / 下载 / 保存到 Memos / 飞书
- 默认设置、API Key 管理

**明确不做**：
- Get 笔记、金山文档（v1.1）
- StyleMatcher（v1.1）
- 系列聚合（v1.1）
- 多页拼接、本地 LLM（v1.2）

### 12.2 v1.1（上线后 6 周）

- 补齐 Get 笔记、金山文档适配器
- 上线 StyleMatcher（完整版）
- 上线 Chronicle（完整版，含去重、系列聚合、周回顾）
- 支持 8 种页面类型完整覆盖

### 12.3 v1.2（上线后 16 周）

- Firefox 支持
- 本地 LLM 模式（Ollama）
- 自定义模板编辑器
- 批量转卡（选中多个书签一次处理）

---

## 13. 风险与应对

| 风险 | 影响 | 应对 |
|---|---|---|
| LLM 调用耗时 > 10 秒 | 破坏 10 秒节奏 | 分步流式展示、Skill 并行、预热缓存 |
| 页面类型识别错误率高 | 用户信任受损 | confidence 透明展示 + 一键切换 |
| 笔记系统 API 变更 | Adapter 崩溃 | Adapter 独立版本管理，可热更新 |
| 用户凭证泄露 | 严重安全事件 | 本地 AES 加密 + 最小权限 Token |
| Manifest V3 政策变动 | 插件下架 | 架构保持与 V3 兼容，监控 Chrome 公告 |
| 用户对"AI 生成"不信任 | 留存低 | 引用溯源 + 原文对照 + 低侵入设计 |

---

## 14. 成功指标

### 14.1 北极星指标

**周活跃制卡数 / 用户**（Weekly Cards per User, WCU）

目标：
- MVP 结束时：WCU ≥ 5
- v1.1 结束时：WCU ≥ 10

### 14.2 过程指标

| 指标 | MVP 目标 | v1.1 目标 |
|---|---|---|
| 日活用户（DAU） | 500 | 3,000 |
| 周留存（W1） | 40% | 55% |
| 卡片生成成功率 | ≥ 95% | ≥ 98% |
| 生成端到端 P50 耗时 | ≤ 10s | ≤ 8s |
| 平均保存目的地数 | 1.2 | 1.6 |
| Skills 降级率 | ≤ 10% | ≤ 5% |

### 14.3 定性指标

- 用户访谈中能清晰说出"NoteSeed 和 Pocket / Notion Clipper 的不同"
- 能复现"一周后用到了存过的卡"的场景
- 对 StyleMatcher / Chronicle 等差异化功能有正向反馈

---

## 附录 A：术语表

| 术语 | 含义 |
|---|---|
| Skill | NoteSeed 中可组合的原子能力单元 |
| KnowledgeCard | 一张结构化的知识卡片（核心业务对象） |
| Adapter | 面向某个笔记系统的适配实现 |
| pageType | 页面语义类型（8 种） |
| userStyleProfile | 用户写作风格的本地特征档案 |
| Side Panel | Chrome Manifest V3 的侧边栏 API |

## 附录 B：参考的 Skills 设计文献

- 本 PRD 的 Skills 架构受 Anthropic Skills / Agent Tools 设计哲学启发
- Adapter 模式参考 Gang of Four《设计模式》
- 协议层设计参考 ActivityPub、ATProto 的统一数据模型思路

---

**—— 文档结束 ——**

*NoteSeed，把每一次浏览，都变成一次沉淀。*
