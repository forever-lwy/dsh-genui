# GenUI 主题参考

由 `genui_docs` 按需返回；每个 `## ` 小节是一个主题。

## rich-text

> 组件文字字段里的行内富文本、换行与公式

公式：`$...$` / `\(...\)` 为行内公式，`$$...$$` / `\[...\]` 为独立公式；支持矩阵、分段函数、多行对齐推导，以及加粗/高亮内的公式。正文、列表、键值、表头/单元格、卡片/步骤/时间线/标签页标题、题目与说明、按钮与表单标签、指标、媒体说明和图表外层标题共用此能力。JSON 字符串中的反斜杠必须双写，如 `"content": "\\(\\frac{a}{b}\\)"`。代码源码、输入值/占位符、原生下拉选项和图表引擎内部绘图文本仍遵循各自的原生格式，不解析富文本。数学语法以 KaTeX 为准，不执行 HTML、外部资源或脚本；不支持 LaTeX 文档编译、加载任意宏包。


`text.content`、`list` 项、`table` 文本列、`keyvalue` 值、`callout` 标题与正文里可以直接写四种行内标记——**重点留在句子里，不必为一个词单起一个组件**：

| 写法 | 渲染 |
|---|---|
| `` `code` `` | 行内代码胶囊 |
| `**加粗**` | 强调（不换行、不成块） |
| `==高亮==` | 极淡底色标记 |
| `[文字](https://…)` | 行内链接（http/https/mailto；围栏会话中的本地文件链接支持右侧栏打开与行号定位；无效目标及独立 HTML artifact 中的本地文件链接显示为普通文字） |
| JSON `"\n"`（真实换行符） | 换行——**多段文字写同一个字段**，不要为换行拆成多个节点 |

不嵌套、不解析 HTML（每个标记生成 React 元素，不走 innerHTML；`<br>` 字面显示，换行用 `"\n"`）；标记没闭合时原样显示。表格文本、`badge`、`delta` 单元格、分组标题和明细首格支持现有 http/https/mailto 外链与本地文件链接，可直接用于日报的来源列；无效目标仍显示为普通文字。点击链接不会同时折叠分组或展开明细。表头不解析链接，`bar`、`spark`、`ring`、`index` 等专用数值单元格保持原有展示。

文字字段只支持行内富文本。`text.content`、`callout.content`、`list` 项、`keyvalue` 值、`table` 单元格等字段中不要嵌入 Markdown 表格或连续三个及以上反引号、波浪号组成的代码围栏；表格使用 `table`，代码使用 `code`，代码改动使用 `diff`，结构化 JSON 使用 `json`。误写入文字字段的代码围栏连同内部标记保持原文，未闭合时从围栏标记开始保持原文。校验返回 `warning=block_markdown` 时，按照 `replacement` 改写结构节点并重新验证。

## interaction

> 本地优先、action 回传、秘密禁令、状态持久化、卷子模式

**本地优先（v2.6）**：UI 自己能做的状态变化——判卷、判题、重置、展开、选中——一律本地即时完成，**零模型往返**。action 只用于必须模型参与的事（生成新内容、执行工具、下一步建议）。**交互组件必须带 action：不带 action 的按钮渲染为禁用态，用户点不了；带 action 的按钮点击后有「已触发」本地反馈。**

- **秘密禁令**：不得索取或生成密码、API Key、访问令牌、恢复码等秘密输入；遇到此类需求直接拒绝并解释

**状态持久化（v2.7）**：radio 答案、checkbox 分组选择、交卷锁定、输入值和 Editor 草稿按「会话 + 内容指纹」自动保存——用户刷新页面/重开会话，同一块 UI 的状态原样恢复；你重渲染**相同内容**会保留用户状态，渲染**新内容**（换题等）自动从头开始。

**卷子模式（多道选择题）**：每题一个 radio（带唯一 `group` + `answer` + `explanation`），最后放一个 submit（`groups` 列出全部题号）——用户全部选完点交卷，**分数和对错当场在 UI 里出现**，不用等你。只有换新题/进阶建议才发 action。不要每题单独发 action（会刷屏）。

## when

> 任意节点的条件显隐 when / enableWhen

- when（**任何节点都能带的条件显隐**）: `{"field":"<id 或 group>","op":"eq|neq|in|not-in|gt|gte|lt|lte|empty|not-empty|checked","value":...}` — 条件读的是**当前 block 自己的状态**：`input/select/slider/textarea/editor/date-picker/segmented-control/map/diagram` 按 `id`，`radio/checkbox/choices` 按 `group`。满足才渲染，不满足整棵子树都不出现；状态变化即时生效，不需要模型往返。字段显隐条件不能互相形成循环引用。
  - **典型用法**：选了「公司主体」才出现「税号」；金额 > 1000 才出现「分期」；选了「自定义」才展开参数（`eq`）；多选里含「其他」才出现补充输入（`in`）。
  - **两条硬规则**：① 隐藏节点不渲染，读者看不到就绝不会提交它的旧值（`submit` 的 `fields`/`answers` 会剔除隐藏键）；② 隐藏字段不算「未填」，不会把提交按钮卡成不可用。
  - 缺省行为：没有 block 状态时（导出 HTML、面板无 provider）条件无法求值，节点**保持可见**——宁可多显示，也不静默删掉导出文档的一整个分支。
  - `in`/`not-in` 的 `value` 必须是数组；`gt`/`gte`/`lt`/`lte` 两边都按数字比较，非法数字视为不满足。

## local-files

> 本机截图与本地文件进回答的地址写法

**本机截图怎么进回答**：`image` / `image-group` / `compare` 的 `src` 只接受浏览器能拿到的地址。本机文件走宿主已有的鉴权文件路由，直接写 URL，不用搬文件、不用配目录：
`/api/file?path=<绝对路径，percent-encoded>`（例：`/api/file?path=%2FUsers%2Fme%2Fproj%2F.a.png`）。宿主用同一个路由渲染 Markdown 里的本地图片，支持 png/jpeg/webp/gif/svg，带大小上限与沙箱策略。典型用法：同一处改动前后各截一张，用 `compare` 摆出来，而不是用文字描述"改了什么"。

## layouts

> 回答级范例与版式参考（多块回答时读）

### 范例：示范「判断」，不要照抄组件序列

每个范例后面都跟着**什么时候不要这样**。组件多是好事——只要每个都在承载不同信息、并且有焦点和层次；真正的毛病是重复表达、以及把纯文字段落包进卡片。

#### 1. 状态汇报（多点 + 有构图）

```json dsh-ui
{"items":[{"type":"grid","cols":4,"items":[{"type":"stat","label":"<user-language metric>","value":"26","delta":"#123–#148"},{"type":"stat","label":"<user-language metric>","value":"0"},{"type":"stat","label":"<user-language metric>","value":"556","delta":"<user-language status>"},{"type":"stat","label":"<user-language metric>","value":"45"}]},{"type":"table","columns":["<user-language column>","<user-language column>","<user-language column>"],"types":["text","badge","text"],"rows":[["<user-language text>","<user-language status>","<user-language text>"],["<user-language text>","<user-language status>","<user-language text>"]]},{"type":"callout","tone":"info","title":"<user-language title>","content":"<user-language text>"}]}
```

不要这样：把同一句话既写进正文又放进卡片；也不要为每条信息配一张卡（4 个 stat 排一行就够）。

#### 2. 解释/教学（文字为主，一个点睛组件）

```json dsh-ui
{"items":[{"type":"text","size":"body","content":"<user-language text>"},{"type":"list","items":[{"title":"<user-language title>","desc":"<user-language description>"},{"title":"<user-language title>","desc":"<user-language description>"}]},{"type":"callout","tone":"warning","title":"<user-language title>","content":"<user-language text>"}]}
```

不要这样：每段都配一个组件；把一句话拆成好几个 text 节点（用行内标记就够了）。

#### 3. 对比选型

```json dsh-ui
{"items":[{"type":"table","columns":["<user-language column>","<user-language column>","<user-language column>"],"types":["text","text","badge"],"rows":[["<user-language text>","<user-language text>","<user-language status>"],["<user-language text>","<user-language text>","<user-language status>"]]},{"type":"callout","tone":"success","title":"<user-language title>","content":"<user-language text>"}]}
```

不要这样：表格里放同一批数据后又画一张图。

反例（这条会被围栏校验直接拒绝，所以别抄）：

```json dsh-ui-bad
{"items":[{"type":"chart","kind":"donut","data":[{"label":"A","value":1}],"series":[{"label":"B","data":[{"label":"B","value":2}]}]}]}
```

为什么拒：`series` 只对 `bars`/`line` 有效；环形图给了 `series` 属于契约冲突，围栏会**静默降级为代码块**。

#### 4. 排查诊断（顺序即叙事）

```json dsh-ui
{"items":[{"type":"steps","current":1,"steps":[{"title":"<user-language step>","desc":"<user-language description>"},{"title":"<user-language step>","desc":"<user-language description>"},{"title":"<user-language step>","desc":"<user-language description>"}]},{"type":"diff","diffs":[{"path":"PlotBlock.tsx","oldText":"e.preventDefault()","newText":"if (!e.metaKey && !e.ctrlKey) return"}]},{"type":"callout","tone":"info","title":"<user-language title>","content":"<user-language text>"}]}
```

不要这样：把"复现/定位/修复"写成三个卡片并列（那是流程，用 steps）。

#### 5. 数据结论（一个主图 + 明细）

```json dsh-ui
{"items":[{"type":"chart","kind":"line","data":[],"series":[{"label":"<user-language series>","data":[{"label":"<user-language point>","value":8},{"label":"<user-language point>","value":12},{"label":"<user-language point>","value":9}]}]},{"type":"table","columns":["<user-language column>","<user-language column>","<user-language column>"],"types":["text","num","delta"],"rows":[["<user-language text>","8","-4%"],["<user-language text>","12","+50%"]]}]}
```

不要这样：图与表用同一粒度表达同一批数据（图看趋势、表看明细才不重复）。

#### 6. 短回答：正确地不套组件

> 这个改动我先不做了——它要动宿主的输入组件，而你说了不碰宿主。

不要这样：一句话的结论配 stat + 表格 + callout。**没有内容就不发组件，这是对的，不算漏发。**

### 版式参考：几个见过的好形状（不是起点，也不是菜单）

下面这些是真实回答里出现过、读起来顺手的几种排法，放在这里供参考。**它们不是"先挑一个再填内容"的模板**：从内容和读者要做的动作出发，需要时借用其中一段，不需要就自己组合。

尤其不要因为"这份数据像主表明细"就把整条回答套进那个骨架——同一个问题问三次，三次都该长得不一样，因为三次的答案不一样。

#### 阶段图（讲清「分几步 / 怎么变」的默认结构）

适用：一个过程有 2–4 个阶段，或一份数据被分成若干块、逐轮合并。

```json dsh-ui
{"items":[{"type":"text","size":"h2","content":"<user-language 过程名>"},{"type":"card","items":[{"type":"row","items":[{"type":"icon","name":"Function","tone":"info","tile":true},{"type":"col","gap":2,"items":[{"type":"text","size":"h3","content":"<user-language 阶段一：名称>"},{"type":"text","size":"muted","content":"<user-language 这一步做什么>"}]}]},{"type":"arrow","length":22},{"type":"row","items":[{"type":"icon","name":"Nodes","tone":"success","tile":true},{"type":"col","gap":2,"items":[{"type":"text","size":"h3","content":"<user-language 阶段二：名称>"},{"type":"text","size":"muted","content":"<user-language 这一步做什么>"}]}]}]},{"type":"blocks","rows":[{"cells":["<user-language 块 0>","<user-language 块 1>","<user-language 块 2>","<user-language 块 3>"],"color":"#3d7eb8"}],"caption":"<user-language 每块代表什么>"}]}
```

何时不用：只有一步就别画阶段图；纯数值对比用 `chart`，别把数字塞进色块。

#### 主表明细（数据问答的默认结构）

适用：用户问的数据要「先看总量 → 再筛 → 再钻某一行」。

```json dsh-ui
{"items":[{"type":"grid","cols":2,"items":[{"type":"stat","label":"<user-language metric>","value":"<user-language value>","delta":"+3.1%"},{"type":"stat","label":"<user-language metric>","value":"<user-language value>"}]},{"type":"input","label":"<user-language filter>","placeholder":"<user-language hint>","id":"master-filter"},{"type":"table","filter":"master-filter","columns":["<user-language column>","<user-language column>","<user-language column>"],"types":["text","num","badge"],"rows":[["<user-language text>","128","<user-language status>"],["<user-language text>","190","<user-language status>"],["<user-language text>","250","<user-language status>"]],"details":[[{"type":"keyvalue","pairs":[{"key":"<user-language key>","value":"<user-language value>"}]}],null,[{"type":"progress","value":91,"target":80,"label":"<user-language metric>"}]]}]}
```

何时不用：行数 ≤5 不要配 `filter`；没有逐行明细可展开就别配 `details`；展开行里只放该行自己的信息，不要塞与该行无关的图表。

#### 结论卡（分析收尾的默认结构）

适用：指标 + 一个明确判断 + 可执行的下一步（周报结论、复盘、健康度检查）。

```json dsh-ui
{"items":[{"type":"grid","cols":3,"items":[{"type":"stat","label":"<user-language metric>","value":"<user-language value>","delta":"+2.4%"},{"type":"stat","label":"<user-language metric>","value":"<user-language value>"},{"type":"stat","label":"<user-language metric>","value":"<user-language value>","delta":"-1.2%"}]},{"type":"card","tone":"success","title":"<user-language title>","items":[{"type":"text","size":"body","content":"<user-language text>"},{"type":"progress","value":72,"target":80,"label":"<user-language metric>","valueLabel":"72%"}]},{"type":"row","items":[{"type":"button","label":"<user-language action>","tone":"primary","action":"<action-name>"},{"type":"button","label":"<user-language action>","tone":"ghost","action":"<action-name>"}]}]}
```

何时不用：结论还不成立时不要硬造结论卡（先摆数据，让读者自己看）；没有真实可执行的下一步就不要放按钮；`tone` 只有在确实传递语义（好/坏/险）时才用。

#### 封面页（报告开篇的默认结构）

适用：正式报告/复盘/评审材料的**第一屏**——一个大数字定调，一句引言点题，三张摘要卡预告正文。

```json dsh-ui
{"items":[{"type":"hero","label":"<user-language metric>","value":"99.96%","delta":"+0.02%","tone":"accent","title":"<user-language title>","subtitle":"<user-language text>"},{"type":"text","size":"display","content":"<user-language statement>"},{"type":"divider","label":"<user-language chapter>"},{"type":"grid","cols":3,"items":[{"type":"card","title":"<user-language title>","items":[{"type":"stat","label":"<user-language metric>","value":"<user-language value>"}]},{"type":"card","title":"<user-language title>","items":[{"type":"stat","label":"<user-language metric>","value":"<user-language value>"}]},{"type":"card","title":"<user-language title>","items":[{"type":"stat","label":"<user-language metric>","value":"<user-language value>"}]}]}]}
```

何时不用：短回答不需要封面（hero 已是唯一焦点，再加 `display` 就是两个焦点）；hero 与 `display` 同屏时，后面不要再出现 h1 级大标题；普通问答直接给答案，不要套封面。

#### 对比页（方案权衡的默认结构）

适用：两个（至多三个）方案/版本/选型的正面对决——定性取舍进卡，定量差异进表。

```json dsh-ui
{"items":[{"type":"grid","cols":2,"items":[{"type":"card","tone":"success","title":"<user-language option>","items":[{"type":"list","items":["<user-language text>","<user-language text>"]}]},{"type":"card","tone":"warning","title":"<user-language option>","items":[{"type":"list","items":["<user-language text>","<user-language text>"]}]}]},{"type":"table","columns":["<user-language column>","<user-language column>","<user-language column>"],"types":["text","num","num"],"rows":[["<user-language text>","8","12"],["<user-language text>","5","9"]]}]}
```

何时不用：只有单一方案时就是普通陈述，不要硬摆两张卡假装权衡；卡与表要承载**不同粒度**（卡给取舍理由、表给数值对比），两边复制同一批数字就是重复表达。

#### 时间线叙事（过程复盘的默认结构）

适用：有先后顺序的过程/事故/迭代叙事——时间线主叙事，收尾一张卡给汇总结论。

```json dsh-ui
{"items":[{"type":"timeline","items":[{"title":"<user-language milestone>","desc":"<user-language description>","time":"<user-language date>"},{"title":"<user-language milestone>","desc":"<user-language description>","time":"<user-language date>"},{"title":"<user-language milestone>","desc":"<user-language description>","time":"<user-language date>"}]},{"type":"card","title":"<user-language title>","items":[{"type":"keyvalue","pairs":[{"key":"<user-language key>","value":"<user-language value>"},{"key":"<user-language key>","value":"<user-language value>"}]}]}]}
```

何时不用：两步以内的小流程用正文一句话讲清；纯日志列举不要套卡，`timeline` 单独就够。

#### 测验页（教学自测的默认结构）

适用：教学/检查理解——两题以上的成组测验，radio 组带答案与解析，`submit` 聚合交卷本地判卷。

```json dsh-ui
{"items":[{"type":"radio","label":"<user-language question>","group":"q1","options":["<user-language option>","<user-language option>","<user-language option>"],"answer":1,"explanation":"<user-language explanation>"},{"type":"radio","label":"<user-language question>","group":"q2","options":["<user-language option>","<user-language option>"],"answer":0,"explanation":"<user-language explanation>"},{"type":"submit","label":"<user-language action>","action":"grade","groups":["q1","q2"]}]}
```

何时不用：单一知识点用单个 `radio`（自带本地判卷）或 `quiz` 组件，不需要 submit 组卷；题目多于 5 个拆成多条回答分批发。

## computed

> 输入驱动的计算字段 computed

在规格根部用 `computed` 声明有序无关的计算字段。表达式只支持数字、字段 ID、括号、`+ - * / % ^` 和 `sin cos tan asin acos atan sqrt cbrt exp log ln abs floor ceil round min max pow` 白名单函数，以及 `pi/e/tau` 常量；不执行 JavaScript。字段 ID 以字母或下划线开头，后续可含数字，最多 64 个字符。表达式最多 512 个字符、嵌套最多 32 层、每份规格最多 50 个计算字段；未声明字段、循环依赖和无效数值会显示为无效输入，图表会跳过无效点。

`{{fieldId}}` 只用于允许插值的展示字段，例如规格标题、文本和统计卡片文字；代码、SVG、Mermaid 源码及 JSON 等原始数据保留原文，未知展示字段会在校验时报告。输入字段与计算字段重名时，该字段及依赖它的计算字段均显示为无效输入。`chart`、`echart` 的数据点和 `table` 单元格使用 `{"$computed":"fieldId"}` 引用数值。完整 ECharts `option` 中的数据值也可使用该引用。`format` 可设置 `locale`、`style`（`decimal|currency|percent`）、`currency` 和小数位范围。表格显示格式化文字，排序使用原始数值。`number` 输入接受带正负号的小数及科学计数法十进制值；十六进制、二进制和八进制写法无效。暂时无法解析的编辑内容保留在输入框中，不会覆盖上一次有效计算值；必填字段处于无效编辑状态时，提交按钮会禁用并显示提示。

```dsh-ui
{"computed":[{"id":"annual","expr":"monthly*12","format":{"locale":"zh-CN","style":"currency","currency":"CNY","maximumFractionDigits":0}},{"id":"tax","expr":"annual*rate","format":{"locale":"zh-CN","style":"currency","currency":"CNY","maximumFractionDigits":0}}],"items":[{"type":"input","id":"monthly","label":"月收入","inputType":"number","value":"10000"},{"type":"input","id":"rate","label":"税率","inputType":"number","value":"0.1"},{"type":"stat","label":"年度收入","value":"{{annual}}"},{"type":"stat","label":"预估税额","value":"{{tax}}"},{"type":"chart","kind":"bars","data":[{"label":"收入","value":{"$computed":"annual"}},{"label":"税额","value":{"$computed":"tax"}}]},{"type":"table","columns":["项目","金额"],"rows":[["年度收入",{"$computed":"annual"}],["预估税额",{"$computed":"tax"}]]}]}
```

## theme

> 根级 theme 与节点 style

默认外观跟随宿主主题，绝大多数回答不需要改。用户要特定风格（"做成杂志风""深色霓虹""温暖手账风"），或语义需要统一配色时，用下面两层：

**根级 `theme`**（作用于整个围栏，所有组件继承）：

| 字段 | 取值 | 作用 |
|---|---|---|
| `accent` | 颜色（`#7c3aed`、`rgb(...)`、`oklch(...)`） | 强调色：按钮、进度、选中态、图表主色、链接 |
| `radius` | `none` / `sm` / `md` / `lg` / `xl` 或像素数 | 卡片与控件圆角 |
| `density` | `compact` / `normal` / `relaxed` | 间距疏密 |
| `font` | `sans` / `serif` / `mono` / `rounded`，或字体族字符串 | 字体 |
| `surface` | `default` / `flat`（无影无框）/ `outline`（只描边）/ `soft`（淡色底）/ `glass`（半透明磨砂）/ `elevated`（更强投影） | 卡片表面 |
| `background` | 颜色或渐变（`linear-gradient(...)` / `radial-gradient(...)`） | 整块画布背景（自动加内边距与圆角） |
| `text` / `muted` | 颜色 | 主文字色 / 次要文字色 |
| `border` | 颜色 | 边框色 |
| `palette` | 颜色数组 | 所有 `chart` / `echart` 的默认分类色板（节点自身 `palette` 优先） |
| `shadow` | `none` / `soft` / `strong` | 卡片投影强度 |

**节点级 `style`**（任意节点都可带，只作用于该节点外层）：`background`、`color`、`border`、`borderColor`、`borderWidth`、`borderStyle`、`borderRadius`、`padding`、`margin`、`gap`、`fontSize`、`fontWeight`、`fontFamily`、`fontStyle`、`lineHeight`、`letterSpacing`、`textAlign`、`textTransform`、`textShadow`、`boxShadow`、`opacity`、`width`、`maxWidth`、`minHeight`、`backdropFilter`、`filter`、`transform`。值是 CSS 字符串（数字按 px）；含 `url(`、`expression`、`;`、`{}`、`<>`、`@` 的值会被丢弃。可以引用主题变量：`var(--dsl-g-accent)`、`var(--dsl-g-surface)`。

```dsh-ui
{"theme":{"accent":"#e11d48","font":"serif","radius":"lg","surface":"soft","background":"linear-gradient(135deg,#fff1f2,#ffe4e6)","palette":["#e11d48","#fb7185","#fda4af"]},"items":[{"type":"text","size":"display","content":"<user-language headline>","style":{"letterSpacing":"-0.02em"}},{"type":"grid","columns":3,"items":[{"type":"stat","label":"<label>","value":"42%"},{"type":"stat","label":"<label>","value":"1.8k"},{"type":"stat","label":"<label>","value":"+12"}]}]}
```

规则：风格是为内容服务的，先有"必须用组件"的理由，再考虑主题；同一条回答里多个围栏保持同一套主题；深浅色都要可读——给了 `background` 就同时给 `text`，避免浅底配宿主深色模式的浅字。


## html

> ```dsh-html 自定义画面

内置组件表达不了的视觉——海报、插画、信息图、动画演示、特殊排版、交互小玩具、小游戏——直接写一个 `dsh-html` 围栏，内容是 HTML 片段：

````text
```dsh-html
<style>
  .poster { padding: 32px; border-radius: 20px; background: linear-gradient(135deg, var(--dsh-accent), #0ea5e9); color: white; }
  .poster h1 { font: 700 40px/1.1 var(--dsh-font); margin: 0 0 8px; }
</style>
<div class="poster"><h1>…</h1><p>…</p></div>
```
````

- **内联渲染**：画面就出现在围栏所在位置，前后正文照常流动；背景透明、宽度占满正文列、高度随内容自适应（超过上限后在框内滚动）。不要再在外面包一层"卡片"。
- **沙箱**：在独立的沙箱 iframe 中运行，不能访问 DSH 页面、Cookie、本地存储或任何网络请求（`fetch` / XHR / WebSocket 都会被拦截）；表单不会提交、链接在新窗口打开。
- **主题变量**：`--dsh-fg`（主文字）、`--dsh-muted`（次要文字）、`--dsh-bg`（页面底色）、`--dsh-surface`（卡面）、`--dsh-border`、`--dsh-accent`（强调色）、`--dsh-font`、`--dsh-mono`、`--dsh-font-size`，以及 `:root[data-theme="dark"|"light"]`。宿主切换深浅色时变量会实时更新——颜色尽量用这些变量，自己定死颜色时要保证两种主题都可读。
- **写法**：片段即可（不必写 `<html>`/`<head>`）；`<style>` 放在最前；尺寸用百分比/`max-width:100%`，不要写死大于 720px 的宽度；高度不要用 `vh` 或 `height:100%`（画面高度随内容变化，会互相追涨），给出明确像素或让内容撑开；`<canvas>` 按 `devicePixelRatio` 放大以免模糊。
<!-- genui:if scripts=on -->
- **脚本**：可以用内联 `<script>` 做动画、交互和 canvas 绘制；尊重 `prefers-reduced-motion`；不要写死循环或无限增长的定时器。需要把结果交回给你时，在用户点击等操作的回调里调用 `dsh.action("name", {...})`，会以 `[genui-action] name + 数据` 发给你（只在用户刚操作过时生效）。
<!-- genui:end -->
<!-- genui:if scripts=off -->
- **脚本已禁用**：只写 HTML、CSS（含动画/过渡）和 SVG；`<script>` 与事件属性不会执行。
<!-- genui:end -->
<!-- genui:if remote=on -->
- **外部资源**：可以加载 https 的图片、字体、样式和 CDN 脚本（如 d3、three.js）；网络请求（fetch/XHR）仍被拦截。
<!-- genui:end -->
<!-- genui:if remote=off -->
- **外部资源已禁用**：任何 http(s) 资源都加载不了；图片用 data: URI 或内联 SVG，字体用系统字体，脚本库不要从 CDN 引。
<!-- genui:end -->
- **什么时候不用**：文字、表格、普通图表和内置组件能表达的，不要用 `dsh-html`——它不参与 GenUI 的状态保存与判卷，也更费输出。

