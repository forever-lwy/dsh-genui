---
name: genui
description: "Render interactive UI, charts, diagrams or custom drawings inline through the dsh-ui / dsh-html fences. Use only when the reader must act (answer, choose, fill, filter), numbers need a chart, a structure or flow needs a diagram, images need side-by-side comparison, or the user asks for a visual, dashboard or page. Prose answers such as meeting notes, summaries, reports, explanations and plans stay Markdown however long. Preserve conversation language for all user-visible text."
---

# GenUI — 生成式 UI 输出规范

**Language:** Match the user's requested language (otherwise the language of their message) in both surrounding prose and all user-visible UI text: titles, labels, content, options, and explanations. Chinese examples below illustrate the schema only; do not switch the conversation to Chinese after loading this skill. Keep JSON keys, component types, IDs, and actions unchanged. An English request gets English prose and UI text; a Chinese request gets Chinese prose and UI text. `<user-language ...>` tokens are meta-placeholders only. Replace every one with actual content in the conversation language; never emit these placeholders literally.

你可以**在回答正文中间**输出可交互 UI 组件：写一个 `dsh-ui` 围栏（fenced block with language tag `dsh-ui`），内含 JSON 规格，渲染器会把这一整块画成真实组件，文字照常穿插在前后。组件**就是回答的一部分**，不是工具调用。

```dsh-ui
{"title":"<user-language text>","gap":14,"items":[...]}
```

## 围栏书写铁律（先读这一节）

围栏开头那一行的语言标记**统一写 `dsh-ui`**，不要添加标点、引号或注释。渲染器会容错大小写、首尾空格和部分尾部标点；其他语言标记不会作为 GenUI 接管，用户会看到普通代码块。

| 写法 | 结果 |
| --- | --- |
| ` ```dsh-ui ` | ✅ 渲染 |
| ` ```dsh-ui> ` | ✅ 容错渲染；生成时仍应去掉 `>` |
| ` ```dsh-ui ` 带行尾空格 | ✅ 渲染（自动 trim） |
| ` ``` DSH-UI ` | ✅ 渲染（忽略大小写） |
| ` ```dshui ` / ` ```ds-ui ` | ❌ 不是合法标记 |

此前同一模型曾在同一会话里写出 **182** 个 ` ```dsh-ui> ` 围栏并导致静默失效；现在已对这类尾部标点统一容错。写围栏时**只写 `dsh-ui` 这六个字符**，不要加任何标点、引号、注释；收尾必须是单独一行的 ` ``` `。

围栏位置：只写在**回答正文**里。写进 reasoning / 思考块不会渲染，用户看不到。

## 组件词汇（只允许这些 type）

布局：`text` `row` `col` `grid` `card` `carousel` `divider` `spacer` `arrow` `hero`
展示：`stat` `badge` `progress` `list` `table` `keyvalue` `avatar` `image` `image-group` `compare` `audio` `video` `timeline` `file-tree` `breadcrumb` `diff` `json` `code` `callout` `steps` `icon` `blocks`
图表：`chart`（bars/line/donut，可多序列）`plot`（数学函数图）`echart`（ECharts 全功能图表）
交互：`button` `input` `select` `checkbox` `radio` `switch` `slider` `textarea` `editor` `date-picker` `segmented-control` `tabs` `accordion` `copy` `link` `submit` `popover`
高级：`svg` `mermaid` `diagram` `scene3d` `quiz` `entity-card`

**细节按需读取**：上面只是名单。决定要用哪些组件后，调用 `genui_docs`，`items` 填这些组件名（以及需要的主题），读到的才是字段、变体、上限和示例；同一会话里读过的不必重读，没用到的组件不要读。主题：
- `layouts`：多块回答的范例与版式参考（要拼两个以上主组件时读）
- `theme`：根级 `theme` 与节点 `style`（用户要特定风格时读）
<!-- genui:if html=on -->
- `html`：```dsh-html 自定义画面（内置组件画不出时读）
<!-- genui:end -->
- `interaction`：本地优先、action 回传、状态保存、卷子模式（有交互控件时读）
- `when`：条件显隐 / 条件禁用
- `computed`：输入驱动的计算字段
- `rich-text`：文字字段里的加粗、链接、换行和公式
- `local-files`：本机截图进回答的写法
- `icon-names`：全部图标名

## 什么时候用：内容类型 → 组件映射

**默认写 Markdown。** 以文字为主的回答——会议纪要、总结、周报、报告、说明、教程、邮件、方案、清单、问答——再长也用 Markdown 的标题、列表、加粗、引用和表格写，不出 `dsh-ui`。"内容很长""要点很多""想显得精致"都不是用组件的理由：一条 2000 字的纪要用 Markdown 读起来最顺，套成卡片网格反而更难扫读、更难复制。

只有下面几种情况，组件才比 Markdown 更好：

1. **读者要操作**：作答与判卷（`quiz`、`choices`）、填写与提交（表单控件 + `submit`）、在方案间做决定（`choices` 带代价）、在大量数据里筛选（`input` + `filter`）。
2. **数值要看形状**：趋势、占比、分布、对比的数值序列（`chart` / `echart` / `plot`）；只有两三个数字时正文写就行。
3. **结构或流程画成图明显更清楚**：架构、拓扑、数据流、状态机、时序（`diagram` / `mermaid`）。
4. **图片要对照**：改动前后、方案 A/B（`compare`）。
5. **用户明确要视觉化**：仪表盘、卡片、海报、页面、"做成好看的样子"。

**判断只有一句：删掉这个组件，读者会不会更费劲。** 会 → 留着；不会 → 它是装饰，写正文。

**没有配额，也没有硬触发。** 不存在"≥3 条要点就必须出 `list`"、"回答超过 10 行至少一个围栏"、"一条回答 3–8 个组件"这类规则——它们只会让每条回答长成同一个形状。下面的表是**可选词汇表**，回答"已经决定要用组件时，这类内容适合用什么"，不是"出现这种内容就要用"。用户明确要纯文字时以用户为准。

| 你要呈现的内容 | 用这些组件 |
|---|---|
| 数据对比 / 趋势 / 占比 | `chart`（bars/line/donut）、`echart`（ECharts 全功能）、`table` |
| 关键指标看板（用户要仪表盘时） | `stat`、`progress`、`badge` |
| 数据多、需要读者自己找 | `input`（id）+ `table`/`chart`/`list` 的 `filter` 绑定 |
| 流程 / 阶段（有分支、要看图时） | `steps`、`timeline`、`mermaid`（flowchart/sequence/gantt） |
| 架构 / 系统拓扑 / 数据流 / 品牌图 | `diagram`（编辑级，27 种类型；自动布局需求才用 `mermaid`） |
| 目录 / 文件结构 / 层级关系 | `file-tree`、`mermaid`、`accordion` |
| 状态一览 / 检查结果（多项、要扫读） | `badge` + `table` + `progress` 组合 |
| 代码改动对比 | `diff` |
| 图片 / 截图 / 图表预览 | `image`、`compare` |
| 语音 / 音乐 / AI 视频 / 演示录像 | `audio`、`video` |
| 两个方案 / 选项要读者选 | `choices`、`table`、`tabs` |
| 教学 / 自测 / 判断题 | `quiz` |
| 数学函数 / 曲线关系 | `plot`（可带参数滑块、动画） |
| 需要用户操作 / 筛选 / 反馈 | `button`、`input`、`select`、`checkbox`、`radio`、`switch`、`tabs` |
| 3D 物体 / 空间布局 | `scene3d` |
<!-- genui:if html=on -->
| 内置组件画不出的视觉：海报、插画、动画、特殊排版、小游戏 | ```dsh-html 自定义画面（读 `genui_docs` 的 `html`） |
<!-- genui:end -->

普通要点、单条提醒、一段说明、纯代码片段：写 Markdown（列表、加粗、引用、代码块），不要换成 `list` / `callout` / `code` 组件。

多项风险需要统一底色时，复用 `card` 包含 `list`；普通要点直接用 `list`。卡片的严重风险色是 `danger`，提示框对应的是 `error`。

```json dsh-ui
{"items":[{"type":"card","tone":"warning","title":"<user-language risk summary>","items":[{"type":"list","items":[{"title":"<user-language item title>","desc":"<user-language description>"},{"title":"<user-language item title>","desc":"<user-language description>"},{"title":"<user-language item title>","desc":"<user-language description>"}]}]}]}
```

**别用的情况**：一句话能说清的事、纯闲聊、用户明确说不要 UI、以及"为了炫技硬塞"——组件服务内容，不是内容服务组件。

## 回答级版式：默认无卡，焦点唯一

**规则来自设计规范，不是口味**（`design` skill 的 `references/design-reference.md`）：
「通用圆角矩形卡片当默认容器 = 模板思维，默认无卡；只有内容类型确实需要时才加卡片处理」，
「如果替换内容不需要改布局，那就是模板，重做」。

### 三条判据（不设组件数量上限）

1. **必要性**：这个组件承载的信息，用文字表达会明显更差吗？数字对比、趋势、空间关系、代码/数据原文才算过关，否则删掉。
2. **焦点唯一**：一条回答只有一个视觉焦点（最大那张图或那组数字）；其余组件的视觉权重必须明显更低，靠尺寸/位置/色彩强度拉开，**不是靠数组件个数**。
3. **不重复**：同一批数据不做两种表达（表格与图表二选一）。

### 卡片（`card`）只在有明确用途时用

- 需要**并排**的 `grid` 子项（没有边界就分不清内容归属）；
- 承载**数据对象**：表格、图、keyvalue、指标组；
- 同组风险需要**统一语义底色**：`card.tone` 包含 `list`，保留逐项标题与说明。

普通单段文字、普通列表、已经自带边界的表格/图表，**不要包卡**。用 `h3` 标题 + 正文 + 间距代替。

### 层级靠字，不靠框

- 卡片标题 16px / 字重 650 / 句首大小写（**不是** 12.5px 全大写小标签）；
- 12.5px 全大写只用于 eyebrow（如 hero 上方那一行）；
- 大字号带负字距（≥32px 约 -0.022em，20–28px 约 -0.012em），数字列 `tabular-nums`；
- CJK 正文行高 1.7，长段落行宽 ≤68ch；
- 表面对比遵循规范：浅色相邻表面明度差 ≥4%，或阴影 ≥ `0 1px 3px rgba(0,0,0,0.10)`；深色靠半透明白叠加（卡片约 4%，抬升面 8%），投影在深色几乎无效。

### 不要

- 装饰性编号（①②③）：该分点用 `list`，该分节用标题；
- 同一套骨架每条回答复用（标题栏 → 卡片网格 → 表格 → callout）；
- 为了"显得丰富"堆组件：读者找不到重点就是失败。

### 怎么验证没模板化

`node scripts/genui-usage-audit.mjs` 输出「版式多样性」：不同版式签名数、最常见签名占比、归一化熵（越接近 1 越多样）、每回答 card 数分布。熵明显下降或 card 数不降反升，就说明规则没生效。

## 使用规则

1. **围栏放哪，组件就出现在哪** —— 文字在前后自然流动，不要改用工具渲染、不要解释"这是一个围栏"。**围栏一闭合就立即渲染**（不等整条回答结束），所以可以边写文字边出组件
1.5. **先读后写**：选定组件后用 `genui_docs` 读它们的字段（本会话读过的跳过），再写围栏；凭记忆猜字段是坏围栏的头号来源
2. **组合优先**：复杂界面用 `grid`+`card`+`stat`+`table` 拼，不要追求单一巨型组件
3. **JSON 必须严格合法，发出前完成 4 步自检**：插件**只**修标点级小错（字符串内半角引号、尾随逗号）；**缺括号/错括号等结构错误一律不修**，直接红横幅退化成代码块——写错就重发，别指望兜底。**最容易犯的错：字符串值里用了半角引号 `"`**——中文引语一律写 `“”` 或 `「」`。发出围栏前自检 4 条：① 括号配对：`{` 与 `}`、`[` 与 `]` 数量相等，**收尾序列逐个核对**（长表格最易在最后几行错位：把 `]]}]}` 写成 `]}]}]}`）② 无尾随逗号 ③ 值内引号用中文引号 ④ 最后一个字符必须是 `}`（**`}` 之后不要再写任何字符**——实测常见错误是习惯性追加 `</p>` 或一句解释，整条围栏就解析不了）。不要在 JSON 字符串里放 markdown；超长表格/列表拆成多个组件分开发，宁短勿长
3.5. **字段名逐个核对**：未知组件类型（包括 `Card` / `Text` 等大小写误写）以及缺失必填字段会被校验工具拒绝。正文可保留其余有效组件；无法修复时展示源码和诊断，不会假报渲染成功。`tabs[].items` 必须提供（允许显式空数组），`content` 可作为别名；`card.body` / `card.content` 会归一化为 `items` 并提示。高频误写：`callout` 正文是 `content`（不是 text/body）；`table` 要 `columns` + `rows`（只给二维 rows 时首行会当表头）；`keyvalue` 要 `pairs:[{key,value}]`；`diff` 是 `diffs`；图片/音视频是 `src`；`code` 是 `code`、`copy` 是 `text`。<!-- genui:if validation=always|uncertain -->
拿不准就调 `validate_dsh_ui`，不要凭直觉命名。
<!-- genui:end -->
4. **不要嵌套围栏**：dsh-ui 里不要再包 ``` 代码围栏
5. **深色主题友好**：配色选深底亮色；UI 主题跟随应用
6. **场景判断**：先判断是否属于上面五种情况——不属于就写 Markdown，长回答也一样；属于时再查映射表选最小的那个组件
7. **图表范围**：`plot` 给合理 xMin/xMax（如 -3.14 到 3.14）；3D 场景 mesh 少而精
8. **规格要紧凑**：整棵组件树 ≤200 节点、≤8 层嵌套；单个 `table` ≤50 行、≤12 列，`list` ≤50 项，`file-tree` 每层 ≤50 个节点；单个 `tabs` ≤12 个标签页、`accordion` ≤24 项。超出限制的内容会被截断；长内容请分成多个组件。
9. **一个主题选一个主组件**：命中映射表后选**一种**组件承载，同一信息不要用两种组件重复表达（同一批数据又画 bars 又画 donut = 冗余）
10. **一个主题一个主组件**：不要把同一件事拆成五块小组件凑数量；宁缺毋滥，纯文字讲清就不出。反例：该用 `table` 对比时写三段 `text`；一个 `stat` 能说清的事套 `card`+`grid`；与内容无关的 `scene3d` 炫技——3D 只在内容本身就是几何/空间时才用
12. **给命令就给能直接粘的**：多行 python 一律写成 heredoc 包装的**一整段** shell 代码块（`python - <<'PY'` … `PY`），不要用 `python -c "…"` 配反斜杠续行——续行在复制/粘贴里最容易碎成多行，用户还得自己拼回 heredoc。单行表达式才用 `-c`，且必须真的在一行内写完。示例：

    ````text
    cd /path/to/repo
    python - <<'PY'
    import json
    d = json.load(open('report.json'))
    print(d.get('status'))
    PY
    ````

    同理：需要用户执行的脚本放进 `code` 节点（`lang`: `bash`/`python`）或正文围栏，并保证**从第一行到最后一行一次粘进终端就能跑**。
<!-- genui:if validation=always -->
11. **先验后发（复杂 UI）**：发出 ```dsh-ui 围栏前，若 spec ≥3 个组件、含 `table`，或任一组件接近资源上限，先调用 `validate_dsh_ui` 工具（参数 `spec` 传围栏内的 JSON 文本）验证；返回 `next=fix_and_revalidate` 就按诊断修正后重新验证；返回 `next=emit_fence` 再发出；返回 `next=emit_repaired_fence` 时直接照抄 `repaired_json` 发出，无需再次验证；简单 UI（≤2 个组件且未接近资源上限）不必验证，渲染器会自动修复大部分标点/括号错误
<!-- genui:end -->
<!-- genui:if validation=uncertain -->
11. **拿不准再验**：字段名、结构或资源上限拿不准时，先调用 `validate_dsh_ui`（参数 `spec` 传围栏内的 JSON 文本）；返回 `next=fix_and_revalidate` 就按诊断修正后重新验证，`next=emit_fence` 再发出，`next=emit_repaired_fence` 直接照抄 `repaired_json`。有把握的围栏直接发出，渲染器会修复标点级小错。
<!-- genui:end -->
<!-- genui:if validation=skip -->
11. **直接发出**：本环境不提供校验工具。发出前按第 3 条自检括号、逗号、引号与字段名后直接写围栏；坏组件会被丢弃、坏围栏退化成代码块。
<!-- genui:end -->
