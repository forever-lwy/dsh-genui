# GenUI 组件参考

由 `genui_docs` 按需返回；每个 `## ` 小节对应一个组件（`/` 分隔的是同一节的别名）。

## text

- text: `{"type":"text","size":"display|h1|h2|h3|body|muted|caption","content":"...","align":"left|center|right"?}`（`tone:"danger|success|warning|info|muted"` 给整行文字上语义色，不用套 badge；`mono:true` 走等宽字体，用于十六进制/二进制/标识符，不带行内代码底色）（`size:"display"` 比标题大一档，作引言/开篇点题句，**一条回答 ≤1**；`center:true` 是旧写法，等价 `align:"center"`，新写一律用 `align`）

## row / col

- row / col: `{"type":"row"|"col","items":[...],"wrap":true?,"spacer":true?,"gap":n?}`；`row.justify:"center"` 主轴居中（图标+标题那种图头）；`col.width:n`（1-100）给这一列占行宽的百分比，不写就按内容宽

## grid

- grid: `{"type":"grid","cols":n,"items":[...]}`；`columns` 可作为 `cols` 的别名，校验会提示使用规范字段。

- span: 任意节点都可加 `"span":2`（grid 子节点占几列）——bento 排版的唯一原语：一张 `span:2` 宽卡配一张窄卡，比一列方块堆下去好看得多

## carousel

- carousel: `{"type":"carousel","title":"<user-language title>","items":[{"type":"card","title":"...","items":[...]}],"itemWidth":240?,"gap":3?}` — 原生节点横向滚动；最多 24 项，宽度 80–640px 且不超过轨道宽度的 85%；默认宽度 240px。`gap` 数值乘以 4px，省略时为 12px，负数按 0 处理。导航按钮每次滚动轨道宽度的 85%，仅在内容溢出时显示，触摸设备直接滑动轨道。不自动播放。轨道聚焦时支持左右键 / Home / End，卡片内表单按原提交规则工作。浏览与滑动不发 action；子组件自身声明的 action 按既有交互规则触发。流式输出只在尾部追加卡片以保留已有输入路径。

## hero

- hero: `{"type":"hero","title":"<user-language title>","subtitle":"<user-language text>","value":"99.96%","label":"<user-language metric>","delta":"+0.02%","spark":[...],"tone":"accent|success|warning|danger"}` — **封面块**：eyebrow + 超大数字（52px，带入场计数）+ 标题 + 副标题 + tone 渐变底色。**一条回答最多用一个**，放在最前面当视觉锚点

## card

- card: `{"type":"card","title":"...","items":[...]}`；`"tone":"info|success|warning|danger"` 给卡片语义底色（用于结论卡/风险卡）；`"accent":"#f59e0b"` 指定强调色（边框 + 标题 + 极淡底色）；`"flat":true` 去掉阴影、换成极淡中性底——**图里的面板必须用 flat**，否则每层都像浮起的卡片，叠两层就脏了；`"eyebrow":"<user-language 小引题>"` 在标题上方加一行 meta 小字（把多张卡分章时用——**连续同章的卡片不要每张都加**，一段回答 ≤3 个）

- span: 任意节点都可加 `"span":2`（grid 子节点占几列）——bento 排版的唯一原语：一张 `span:2` 宽卡配一张窄卡，比一列方块堆下去好看得多

## divider

- divider: `{"type":"divider"}`；**带章节名** `{"type":"divider","label":"<user-language 章节名>"}`（线 + 小标签居中，作章节切换：报告从摘要切入数据、图表册开新章时用一段；卡片/列表内部、连续同主题内容之间**不要用**，一条回答 ≤3 个）; spacer: `{"type":"spacer"}`

## spacer

- spacer: `{"type":"spacer"}` — 纵向留一段空白，无其他字段。只在两组内容需要额外呼吸时用；横向把子项推到两端用 `row` 的 `"spacer":true`；章节切换用带 `label` 的 `divider`。

## stat

- stat: `{"type":"stat","label":"...","value":"...","delta":"+12.4%|-3%"}`（`-` 开头自动红、`+` 绿）；可选 `"spark":[3,5,4,8,6]` 画一条微趋势线（2–60 个有限数值）；`"size":"hero"` 渲染超大数字（一条回答最多用一次，作为视觉锚点）

## badge

- badge: `{"type":"badge","label":"...","tone":"success|warn|danger|accent","icon":"emoji?"}`

## progress

- progress: `{"type":"progress","label":"...","value":0-100,"valueLabel":"70%"}`；`"variant":"ring"` 画环形进度，`"target":70` 在轨道上标出目标刻度

## avatar

- avatar: `{"type":"avatar","name":"...","color":"#hex?"}`

## image

- image: `{"type":"image","src":"/mmx-files/result.png","alt":"<user-language description>"}` — 展示浏览器可访问的 http(s) 或同源相对图片地址；懒加载；不支持 `file:`/`data:` 等本地或主动协议；`"caption":"<user-language 图注>"` 在图**下方**加说明行（来源/解读/署名；`alt` 是图**上方**的标签行，两者分工不同）

本机截图与本地文件的地址写法见 `genui_docs` 主题 `local-files`。

## image-group

- image-group: `{"type":"image-group","title":"<user-language title>","items":[{"src":"/mmx-files/a.png","alt":"<description>","caption":"<caption>"},{"src":"/mmx-files/b.png","alt":"<description>"}]}` — 最多 24 张图片按长宽比自适应换行；点击原生 lightbox 放大，左右键 / Home / End 切图，Esc / 关闭按钮返回并恢复焦点。沿用 image 的 http(s) / 相对地址限制；不接受 file/data/javascript。只做本地浏览，不发 action；需要模型动作请在旁边放独立 button。追加 / 重排保留当前 src；当前图片移除后关闭查看器；相同 src 按出现次序区分。空列表与图片加载失败都有明确状态。导出 HTML 不内嵌图片字节，图片仍依赖原地址。[完整用法与验收](docs/gallery.md)。

本机截图与本地文件的地址写法见 `genui_docs` 主题 `local-files`。

## compare

- compare: `{"type":"compare","title":"<user-language title>","before":{"src":"/shot-before.png","label":"<user-language label>","caption":"<caption>"},"after":{"src":"/shot-after.png","label":"<user-language label>"},"mode":"side|stack|slider","height":260}` — **两张图成对呈现**：改动前后、方案 A/B、原图与重绘。`before`/`after` 都必填，缺一侧整节点丢弃（不是降级成单图）。`mode`：`side`（默认，容器够宽时并排，窄于 560px 自动竖排）、`stack`（始终竖排，适合长截图）、`slider`（单框中间一条可拖动分割线，指针拖动 / 触摸 / 方向键 / Home / End 都能用）。`height` 是框高上限 120–640（默认 260），图片按 contain 装进框内、不裁切。标签 `label` 常显，不靠悬停；点击图片原地开原生对话框放大，Esc / 关闭返回并恢复焦点。图片地址沿用 image 的 http(s) / 相对地址限制；只做本地浏览不发 action。**汇报改动（修了什么、前后差异）时默认用它**，而不是表格或纯文字清单——读者要的是「变成什么样了」，不是字段名。只在两张图必须被对照阅读时才用；同一批无关截图用 image-group。

本机截图与本地文件的地址写法见 `genui_docs` 主题 `local-files`。

## audio

- audio: `{"type":"audio","src":"/mmx-files/result.mp3","alt":"<user-language description>","loop":true?}` — 原生控制条；用户主动播放，不自动播放；仅 http(s) 或同源相对地址

## video

- video: `{"type":"video","src":"/mmx-files/result.mp4","alt":"<user-language description>","poster":"/mmx-files/poster.jpg"?,"loop":true?,"muted":true?,"aspectRatio":"16:9|4:3|1:1|9:16"?}` — 原生播放/音量/全屏控制；不自动播放

## list

- list: `{"type":"list","items":["..."] 或 [{"title":"...","desc":"..."}] 或嵌套节点(如 {"type":"badge","label":"TS"})}` — 行内可嵌节点（计入节点预算）；记录中的 `label`/`name` 归一化为 `title`，`description`/`content`/`text`/`body`/`detail` 归一化为 `desc`；只有正文时将正文用作标题，未知字段会收到警告

## table

- table: `{"type":"table","columns":["..."],"rows":[["...","..."]],"types":["text|num|delta|bar|badge"]?,"details":[[...]]?,"total":true?}` — 表头点击本地排序（升/降/还原，零往返）；数值感知：千分位（`1,234`）、`k/m/b`、`万/亿`、`%`、货币符号都能按真实数值比较，纯数值列自动右对齐；**带符号单元格自动着色**（`+12.4%` 绿、`-3` 红，无需额外字段）；`types` 可按列指定 `bar`（0-100 内联进度条）、`ring`（0-100 小环）、`spark`（单元格写 `"3,5,4,8"` 画微趋势线）、`badge`（胶囊标签）、`delta`（强制涨跌色）、`num`（强制右对齐）、`index`（行号）、`group`（首列当分组标题：该行只有第一格有内容时渲染成跨列小标题）；`"total":true` 追加合计行（数值列自动求和）；**`"export":true`**：表格上方出现「复制 Markdown / 复制 CSV」两个小按钮（纯本地剪贴板，不发请求）；**`"filter":"输入框id"`**：把表格和某个 input/select 绑定，读者输入即时过滤（`filterColumn` 可限定列）——数据多时**默认就该配一个**；**`"sortField":"下拉id"`** 用下拉的值（列名）排序；**`"details"` 与 rows 同序**，第 i 项是该行展开后的内容（可放任意组件，`null` = 该行不可展开）——首列出现 chevron，点开在整行下方展开明细，适合「主表 + 明细」；**`"wrap":true`** 开启长文本排版：单元格、长标识符和行内代码自动折行，保留显式换行；列有可读宽度下限，窄容器仍可横向滚动，嵌套表格独立选择模式（默认关闭，数据表保持单行紧凑；当某列是整句描述时开启）

## keyvalue

- keyvalue: `{"type":"keyvalue","pairs":[{"key":"...","value":"..."}]}`

## timeline

- timeline: `{"type":"timeline","items":[{"title":"...","desc":"...","time":"..."}]}`

## file-tree

- file-tree: `{"type":"file-tree","items":[{"name":"...","type":"file|dir","children":[...]?}]}` — 目录行可点击折叠/展开（本地，零往返）

## breadcrumb

- breadcrumb: `{"type":"breadcrumb","items":["<user-language text>","<user-language text>","<user-language text>"]}`

## diff

- diff: `{"type":"diff","diffs":[{"path":"...","oldText":"..."|null,"newText":"..."}]}`

## json

- json: `{"type":"json","value":...}`（JSON 树查看器）

## code

- code: `{"type":"code","lang":"ts","code":"..."}`

## callout

- callout: `{"type":"callout","tone":"info|success|warning|error","title":"...","content":"..."}` — 用于单条强调、提醒或风险摘要；`content` 是文本字符串，可用 JSON `"\n"` 分行。多条独立事项用 `list` 的 `{title,desc}` 保留逐项层次

## steps

- steps: `{"type":"steps","current":n,"steps":[{"title":"...","desc":"..."}]}`

## arrow

- arrow: `{"type":"arrow","dir":"down|right","length":16-96,"label":"..."}` — 图里两个块之间的**细线连接件**（1.4px 线宽 + V 形箭头，固定长度）。上下流程图一律用它，**不要用文字「↓」**：字符箭头跟着文字基线走，撑不开间距

## icon

- icon: `{"type":"icon","name":"Nodes","tone":"info|success|warning|danger|muted|default","size":16|20|24|32,"tile":true,"label":"<user-language 无障碍名>"}` — 内置图标集（749 个可忠实渲染；64 个内联秒开，其余首次使用时载入，完整名单见 ICON-NAMES.md）。`tile:true` 画成**淡色圆角方底**，用于阶段卡/语义标记；不带 `tile` 是跟随文字色的行内图标。`label` 可省略（纯装饰），成对出现时只给一个加 label


内置图标名：以下 **64 个内联在包里、立即渲染**，优先从这里面选：

Check CheckCircle Info InfoCircle Warning Error X Plus Minus Circle ArrowDown ArrowUp ArrowRight ArrowLeft ArrowCurvedRight Function Functions Operator Atom Nodes Connect Share Branch Grid GridAlt Stack Cube Storage Chart Trending Pulse Speed Timer Clock TableFilled Code SquareCode Terminal File FileCode Folder Link Paperclip Lightbulb Book BookOpen GraduationCap Flask Lab Brain Robot Sparkles ShieldCheck Lock Globe WebsiteNetwork Search MagnifyingGlassSearch PluginPuzzle Settings Bolt Compass

其余 **685 个按需载入**（首次用到时拉取约 1 MB，此后本页全部可用）。完整名单用 `genui_docs` 读主题 `icon-names`，不要在对话里穷举或猜名字。

## blocks

- blocks: `{"type":"blocks","title":"...","rows":[{"label":"初始","cells":["0","1","2"],"color":"#64748b"}],"columns":n?,"caption":"..."}` — **色块图解**：按行分组的格子。三种形态同一个结构：① 阶梯图（每行格子数不同，各行自己等分宽度，如 8→4→2→1）② 等分块（一行 4 块）③ 泳道图（`columns` 固定列数，`cells` 里写 `"—"` 或留空）。`color` 省略时用强调色淡底；文字颜色按亮度自动反转（深底白字/浅底黑字）。**有「分成几份、逐轮推进、分组对照」的结构就用它，不要手写 svg 坐标。** `caption` 必写：一句话说明每格代表什么

  - 行级 `"variant":"outline"`：细边框不填充，用于**矩阵**（每格都是一个框）；`"variant":"plain"`：连框都不画，用于**位串**（`1 0 1 0 0 0 0 0` 读起来是数字不是表格）——只有带 `tone`/`color` 的格子会画出底色
  - 格子可以写成对象：`{"text":"1","tone":"danger","sub":"SF"}` —— `tone`（accent/success/warning/danger/muted）给**单个格子**上语义色，`sub` 在格子下方挂一行小字（位名、序号、角色）。`color` 可显式指定十六进制，优先于 tone
  - 例：`{"columns":8,"rows":[{"variant":"outline","cells":[{"text":"1","tone":"danger","sub":"SF"},"0","1","1","0","0","1","0","0"]}],"caption":"最高位为 1，所以 SF=1。"}`

## chart

- chart: `{"type":"chart","kind":"bars|line|donut","data":[{"label":"...","value":n,"color":"#hex?"}],"series":[{"label":"...","data":[...]}]?,"horizontal":true?}` — bars 默认；line 趋势；donut 占比；**series：bars 是分组柱，line 是多序列折线；每个 `series[].data` 使用 `[{"label":"Q1","value":30},{"label":"Q2","value":45}]` 这样的对象数组，不是 `[30,45]` 这样的纯数字数组**；**`horizontal:true` 画横向柱**（排行/长标签首选）；**`stacked:true` 把 series 堆叠**（构成/占比随时间）；堆叠段够高时数值直接印在段内，鼠标悬停任意柱/段/点/扇区都会弹出即时 tooltip（堆叠显示该段数值 + 合计）。v3 渲染：宽度自适应、Y 轴 1/2/5 刻度、单序列负值在零线以下真实绘制、line 带面积渐变与抽稀 X 标签、donut 图例显示数值与百分比。**≤8 个点的快速对比用 chart；多序列、需要缩放/交互或数据量大时用 echart**

- palette: `chart` / `echart` 都支持 `"palette":["#ff8800","#3ecf8e"]` 覆盖分类色板（默认跟随宿主主题）。**只有语义上需要指定颜色时才写**（成本=红、收益=绿），否则跟随主题更稳

## plot

- plot: `{"type":"plot","series":[{"expr":"a*sin(b*x)","label":"...","color":"#hex?","params":[{"name":"a","value":1,"min":0,"max":5,"animateTo":3,"durationMs":4000,"loop":true},{"name":"b","value":1,"min":0.5,"max":5}]}],"xMin":-6.28,"xMax":6.28,"title":"..."}` — SVG 函数图；**series 可带 `"kind":"line|area|scatter"`**（缺省 line；area 填色到基线；scatter 散点）；**params 渲染成实时滑块**（拖动即时重绘，**y 轴锁定**=只变曲线不变数轴）；**animateTo 参数会显示播放按钮**（自动动画演示）；SVG 可拖拽平移、滚轮缩放；表达式支持 sin/cos/tan/asin/acos/atan/sqrt/cbrt/exp/log/ln/abs/floor/ceil/round/min/max/pow，常量 pi/e/tau，变量 x（其他字母=参数）

## echart

- echart: `{"type":"echart","title":"...","height":300,"preset":"bar|line|area|pie|scatter","data":[{"label":"...","value":n}],"series":[...]?}` — **ECharts 全功能图表**，视觉效果远超 `chart`（渐变、tooltip、动画、图例交互）；**preset 模式**：用和 `chart` 一样的 `data`/`series` 格式，自动构建主题化的 ECharts 配置（颜色跟随宿主主题）；**preset 一览**（只写 preset + data/series/links，主题自动跟随）：

`bar` · `line` · `area` · `pie` · `scatter` · **`radar`**（每 series 一个多边形，指标取第一条 series 的 label）· **`gauge`**（每个 datum 一个仪表，适合单 KPI）· **`funnel`**（漏斗/转化）· **`treemap`**（体积/层级占比）· **`sankey`**（流向，用 `links:[{from,to,value}]`）· **`graph`**（关系图，`links` 驱动，节点大小随连接数）· **`heatmap`**（`series` 当行、第一条 series 的 label 当列）· **`bigline`**（长序列 + 内置缩放）· **`wordCloud`**（词云，`data:[{label,value}]` 的 value 表示权重；颜色跟随 `palette` 或主题调色板）
**full option 模式**：传 `"option":{...}` 直接写 ECharts 原生配置（支持 ECharts 内置图表及已注册的 `wordCloud` 词云扩展；其他第三方扩展不保证可用），option 中的函数会被过滤（只接受数据）。选择原则：**chart 轻量（无额外下载）适合 ≤8 点的快速对比；echart 视觉更丰富（渐变、tooltip、图例交互、dataZoom），但会按需下载约 1MB 引擎，多序列/大屏/交互场景优先**

- palette: `chart` / `echart` 都支持 `"palette":["#ff8800","#3ecf8e"]` 覆盖分类色板（默认跟随宿主主题）。**只有语义上需要指定颜色时才写**（成本=红、收益=绿），否则跟随主题更稳

## button

- button: `{"type":"button","label":"...","tone":"primary|danger|success|ghost","full":true?,"small":true?,"icon":"emoji?","action":"refresh"?}`

## input

- input: `{"type":"input","label":"...","placeholder":"...","inputType":"text|email|color|number","value":"...","action":"name"?,"id":"field-id"?}` — `color` 使用浏览器原生取色器，值使用 `#RRGGBB`；`number` 可作为 Computed 数值输入；action 在失焦**和回车**时触发（回车带 `submit:true`）；**blur 仅值有变化才发送**（聚焦又离开不产生空往返）；payload 带 `id` 帮模型定位字段；带 `id` 的值刷新后保留、并被 submit 收集进 `fields`

- **秘密禁令**：不得索取或生成密码、API Key、访问令牌、恢复码等秘密输入；遇到此类需求直接拒绝并解释

## select

- select: `{"type":"select","label":"...","options":["...","..."],"selected":下标?,"action":"pick"?,"id":"field-id"?}` — `selected` 预选某选项（缺省显示「请选择…」占位，不静默预选第一项）；带 `id` 的选择跨刷新保留并进 submit 的 `fields`

## date-picker

- date-picker: `{"type":"date-picker","label":"...","mode":"single|range","value":"YYYY-MM-DD 或 YYYY-MM-DD/YYYY-MM-DD","min":"YYYY-MM-DD","max":"YYYY-MM-DD","id":"field-id"}` — 使用浏览器原生日期控件；日期必须是真实日历日期，范围模式的值是开始和结束日期组成的 ISO 区间；范围输入完整且有效后，带 `id` 的值进入共享状态与 submit 的 `fields`


```json dsh-ui
{"items":[{"type":"date-picker","label":"Travel dates","mode":"range","value":"2026-10-12/2026-10-18","min":"2026-10-01","max":"2026-10-31","id":"travel_dates"},{"type":"segmented-control","label":"View","options":["Agenda","Map"],"value":"Agenda","id":"view"},{"type":"text","content":"Map view selected","when":{"field":"view","op":"eq","value":"Map"}}]}
```

## segmented-control

- segmented-control: `{"type":"segmented-control","label":"...","options":["...","..."],"value":"...","id":"field-id","action":"pick"}` — 胶囊式单选控件；带 `id` 时选中值进入共享状态，可用于 `when` 更新同级组件，也会进入 submit 的 `fields`；`action` 可选，设置后每次选择都会发送该 action

## checkbox

- checkbox: `{"type":"checkbox","label":"<user-language option>","checked":true?,"action":"toggle"?,"group":"group-id"?}` — 默认保持逐次 `action` 行为；**加 `group` 进入多选聚合模式**：同组 checkbox 可反复勾选/取消，变化只在本地记录、不发逐次 action，兄弟 `submit` 一次性把该组已选 label 作为字符串数组放进 `answers`（例如 `{"styles":["<user-language option>","<user-language option>"]}`）

## slider

- slider: `{"type":"slider","label":"...","min":0,"max":100,"step":1,"value":n?,"action":"name"?,"id":"field-id"?}` — 数值表单滑块：实时显示数值；带 `id` 跨刷新保留并进 submit 的 `fields`（拖拽经防抖合并成一次 action）

## radio

- radio（**legacy，仅用于兼容老围栏**：试卷与决策都改用 `choices`。`choices` 的 `group` + `answer` + `explanation` + 兄弟 `submit` 已覆盖本地判分，且每个选项还能带代价与证据。新回答不要再用 radio）: `{"type":"radio","label":"<user-language label>","options":["<user-language option>","<user-language option>"],"selected":n?,"action":"pick"?}` — 单选；**加 `"group":"group-id"` 进入聚合模式**：选择只本地记录、不发往返；可设置 `"answer":正确下标或标签` 和 `"explanation":"<user-language explanation>"`，在纯 radio 且没有其他待发送表单状态时本地判卷

多道题组卷与本地判分见主题 `interaction`（卷子模式）。

## choices

- choices: `{"type":"choices","title":"<user-language title>","prompt":"<user-language question>","mode":"single|multi","max":2,"submit":"<button label>","action":"<action>","items":[{"label":"<option>","hint":"<one-line cost>","meta":"P0","recommended":true},{"label":"<option>","hint":"...","disabled":true,"reason":"<why unavailable>"}]}` — **要读者做决定的列表**，不是读的列表：每个选项自带一行代价（`hint`）、可选证据（`meta`，右对齐等宽）、`recommended` 推荐标记、`disabled` + `reason`（保留在列表里而不是删掉，读者要看得到为什么不行）。`mode` 默认单选；`multi` 配 `max` 控制上限。选中的行左侧有强调条 + 淡底，提交后显示「已发送 · 仍可修改」并且**允许继续改**（改了就清掉已发送状态）。`action` 缺省时选择完全留在本地；有 `action` 时提交回传 `{question, selected, mode}`。最多 8 项——超过 8 项说明这是一张表，不是一次选择。

多道题组卷与本地判分见主题 `interaction`（卷子模式）。

## link

- link: `{"type":"link","label":"...","href":"https://..."?}` — 仅 http(s)/mailto 协议被接受；无 `href` 时渲染为纯文本样式（不会假装可点）

## submit

- submit: `{"type":"submit","label":"<user-language action>","action":"grade","groups":["q1","styles"],"resetAction":"redo"?}` — 聚合按钮：`groups` 引用当前 block 中的 submission member key，来源为 `radio.group`、`checkbox.group`、`input.id`、`textarea.id`、`editor.id`、`select.id`、`slider.id`、`date-picker.id`、`segmented-control.id`、`map.id`、`diagram.id`；radio 需已选择，checkbox 组需至少选择一项，普通 field 的值需在 trim 后非空。`groups` 控制提交所需成员与完成进度；未设置时，至少有一个已完成成员即可提交。纯 radio 范围含 `answer` 且本次没有范围外 payload 时可本地判卷；其余场景一次发送 `[genui-action]`，payload 继续收集当前 block 中已填写的表单状态，字段名称保持 `answers`、`fields`、`total`、`answered`

多道题组卷与本地判分见主题 `interaction`（卷子模式）。

## switch

- switch: `{"type":"switch","label":"...","checked":true?,"action":"toggle"?}`

## textarea

- textarea: `{"type":"textarea","label":"...","placeholder":"...","rows":n?,"value":"...","action":"save"?,"id":"field-id"?}` — action 在失焦和 **Ctrl/Cmd+Enter** 时触发；blur 仅值有变化才发送；带 `id` 的值刷新后保留

## editor

- editor: `{"type":"editor","id":"draft","label":"正文","value":"初始文本","placeholder":"继续编辑","rows":8}` — 纯文本编辑；编辑内容实时同步到当前区块；启用状态持久化且存储成功时，刷新可以恢复；可复制当前文字；带 `id` 的值也可由 sibling `submit` 统一提交

**状态持久化（v2.7）**：radio 答案、checkbox 分组选择、交卷锁定、输入值和 Editor 草稿按「会话 + 内容指纹」自动保存——用户刷新页面/重开会话，同一块 UI 的状态原样恢复；你重渲染**相同内容**会保留用户状态，渲染**新内容**（换题等）自动从头开始。

```dsh-ui
{"items":[{"type":"editor","id":"reply","label":"回复草稿","value":"你好，","rows":6},{"type":"entity-card","name":"Ada Lovelace","description":"数学家","metadata":[{"label":"领域","value":"计算机科学"}],"href":"https://example.com/ada","actions":[{"label":"查看详情","action":"open-ada"}]},{"type":"popover","label":"保存说明","content":"编辑内容会保存在当前区块中。","trigger":"click","placement":"top"}]}
```

## entity-card

- entity-card: `{"type":"entity-card","name":"Ada Lovelace","image":"https://example.com/ada.png","description":"数学家","metadata":[{"label":"领域","value":"计算机科学"}],"href":"https://example.com/source","sourceLabel":"来源","actions":[{"label":"查看详情","action":"open-ada"}]}` — 展示实体图片、名称、描述、元数据、来源链接和操作按钮；操作按钮通过 `action` 发送给宿主

## popover

- popover: `{"type":"popover","label":"说明","content":"补充信息","trigger":"click","placement":"top"}` — 补充说明可设为 `click` 或 `hover` 触发；支持键盘焦点、Escape 和外部点击关闭，位置会在视口边缘自动调整

## tabs

- tabs: `{"type":"tabs","tabs":[{"label":"...","items":[...]}]}` — 空 tab 可以省略 `items`，会按空数组处理

## accordion

- accordion: `{"type":"accordion","items":[{"title":"...","items":[...]}]}`

## copy

- copy: `{"type":"copy","label":"<user-language action>","text":"<user-language text>","expandable":true?,"previewLines":n?}` · [docs/copy-preview.md](docs/copy-preview.md)

## svg

- svg: `{"type":"svg","title":"<user-language title>","height":300,"code":"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 100\"><rect width=\"200\" height=\"100\" fill=\"#534ab7\"/></svg>"}` — 独立 SVG 图片预览；`title`/`height` 可省略，height 为 100–800，code 最多 12,000 字符，超限会拒绝而不会截断；验证工具返回字段路径、实际长度和上限，请精简或拆成多个 svg 后重验。裸 svg 围栏预览使用相同上限。必须提供完整 SVG 文档（含 xmlns），建议带 viewBox。使用隔离图片模式，不支持脚本、宿主 CSS 或外部资源；图形无法加载时显示源码和提示。**放在 dsh-ui 围栏中；这不是 ECharts renderer 配置。**

- 也可以直接输出 ```svg 代码围栏（不带 dsh-ui 包装）：会自动显示为「预览/源码」切换的图形预览，源码可复制；无法解析时保留源码并提示。

## mermaid

- mermaid: `{"type":"mermaid","code":"graph TD\\nA-->B"}` — flowchart/sequence/class/gantt/pie/er/state/journey；主题自动跟随宿主（暗/浅）

## diagram

- diagram: `{"type":"diagram","kind":"architecture","id":"selectedNode","title":"<user-language title>","variant":"light|dark|editorial","nodes":[...],"edges":[...],"theme":{...}}` — **编辑级交互图解**（27 种视觉类型）。节点: `{"id":"a","label":"<user-language label>","description":"<detail shown after selection>","type":"focal|backend|store|external|input|optional|security","x":40,"y":40,"w":128,"h":48,"sub":"<user-language text>","tag":"<user-language text>"}`；边: `{"from":"a","to":"b","label":"<user-language label>","kind":"solid|dashed|accent|link"}`。用户可点击节点或按 Enter / Space 选择节点；图解会突出选中节点并显示说明。`id` 指定共享字段，所选节点 ID 可供其他组件的 `when.field` 读取。选择在本地更新，不触发模型 action。**规则由渲染器强制**: 正交连接器（r=8 弯折、禁止斜线）、4px 网格、语义 token（paper/ink/muted/accent）、焦点色 ≤2 个、复杂度预算（≤9 节点/≤12 边）、z-order（箭头在节点后）、边标签 6-10px 间隙。27 种 kind：architecture / it-state / flowchart / sequence / state / er / timeline / swimlane / quadrant / radar / loop / nested / tree / org-chart / layers / venn / pyramid / bar / line / gantt / scatter / high-level / process / medallion / data-flow / dp-integration / dp-security-matrix。**坐标类 kind**（architecture/it-state/high-level/process/medallion/data-flow/dp-integration）用 x/y/w/h 精确定位；**规则类 kind** 只给数据自动排版。架构/流程/层次结构优先用 diagram（自动布局需求才用 `mermaid`）。

## scene3d

- scene3d: `{"type":"scene3d","title":"...","meshes":[{"shape":"box|sphere|cone|cylinder|torus","color":"#hex?","size":n|[w,h,d]?,"position":[x,y,z]?,"rotation":[rx,ry,rz]?,"scale":n?|[...]?}],"ambient":0-2?,"background":"#hex?"}` — 3D WebGL，可拖拽旋转、滚轮缩放；mesh 数量 1–5 个

## quiz

- quiz: `{"type":"quiz","question":"...","options":[{"label":"...","correct":true?,"feedback":"..."?}],"explanation":"...","id":"..."?,"action":"answer"?}` — 教学问答：点选即判题、可重试；`id` 变化时重置；带 action 时另回传 `{type:'quiz',question,answer,correct}`

多道题组卷与本地判分见主题 `interaction`（卷子模式）。

## map

需要让用户比较地点、选择候选位置或查看示意路线时，使用原生 `map`，不要用静态图片伪装交互地图。默认是无街道底图的离线坐标地图，真实标记与路线由 MapLibre 渲染。地点列表始终可用。

```dsh-ui
{"items":[{"type":"map","id":"stop","title":"候选地点（合成示例）","locations":[{"id":"a","label":"地点 A","coordinates":[12.49,41.89]},{"id":"b","label":"地点 B","coordinates":[12.51,41.90]}],"routes":[{"id":"r","label":"示意路线，非导航","coordinates":[[12.49,41.89],[12.51,41.90]]}]},{"type":"submit","label":"确认地点","action":"choose_stop","groups":["stop"]}]}
```

- `locations` 必填，最多 50 项：`id` 唯一且稳定，`label`，`coordinates: [经度, 纬度]`，可选 `description`。坐标必须有限，经度 [-180,180]、纬度 [-90,90]；不确定坐标时不要编造真实地点。
- 可选 `routes` 最多 8 条，每条有 `id`、`label`、2–500 对内联坐标。只接受 LineString 路径，不调用导航、地理编码或远程 GeoJSON。不要声称路线可安全通行、距离或预计时间已核实。
- 可选 `center`、`zoom`（0–20）、`height`（200–640）、`selected`（地点 ID）。选中标记与列表双向同步；缩放、重置视图、清除选择都只在本地执行。
- `id` 复用表单字段持久化，独立 `submit` 才发送 `fields[id] = 选中地点 ID`。不要在 map 上写 `action`。
- 不允许在模型 JSON 中设置 style、source URL、worker URL、API key 或凭据，不请求地理位置权限。外部底图只能由可信宿主配置。导出保留离线坐标地图，不导出宿主的私有样式配置；分享前审查地点隐私。
- 资源或 WebGL 不可用时明确降级为可操作地点列表与路线坐标，不把降级描述成完整地图。完整契约见 `docs/map.md`。
