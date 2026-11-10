/**
 * The always-present system-prompt section, built from the live settings
 * (fork: forever-lwy).
 *
 * Fork changes against upstream 0.16.0:
 * - Markdown first. Upstream's "would the reader struggle without it" test
 *   still let long prose (meeting notes, summaries, reports) turn into
 *   card/list/callout stacks, because length and "key points" read as
 *   structure. The section now says plainly that prose answers, however long,
 *   stay Markdown, and lists the few cases a component earns its place.
 * - Validation wording follows `validation` (always / uncertain / skip).
 * - Root `theme` + per-node `style`, and the sandboxed ```dsh-html fence for
 *   drawings the built-in vocabulary cannot express.
 * @module @forever-lwy/dsh-genui/plugin/prompt
 */
import type { GenuiConfig } from '../shared/genui-config.ts'
import { DEFAULT_GENUI_CONFIG } from '../shared/genui-config.ts'

export const RENDER_UI_TOOL_GUIDANCE = '- Tool channel: render_ui 工具把同一 spec 渲染为工具行卡片；围栏用于回答内联 UI。'

const INTRO = `Render UI inside your reply with a fenced \`dsh-ui\` JSON block:

\`\`\`dsh-ui
{"title":"示例","gap":14,"items":[{"type":"text","content":"把这里换成你的组件"}]}
\`\`\`

Allowed \`type\` values (one-line roles below). Before writing a fence, call \`genui_docs\` with the components (and topics) you chose to read their fields and examples — only ones not read earlier in this conversation; the \`genui\` skill holds the layout rules:

- 布局: text 文字 · row/col 横排/竖排 · grid 网格（子节点 span 宽窄混排） · card 卡片 · carousel 横向轮播 · divider 分隔（可带章节名） · spacer 留白 · hero 封面块（一条回答最多一个）
- 展示: badge 标签 · stat 指标 · progress 进度条/环 · list 列表 · table 表格（排序/筛选/行明细） · keyvalue 键值 · timeline 时间线 · file-tree 目录树 · breadcrumb 路径 · callout 提示框 · steps 步骤 · diff 代码改动 · json · code · copy 可复制文本 · avatar 头像 · image 图片 · image-group 图集 · compare 前后对比（改动汇报优先） · audio · video · icon 图标 · blocks 色块矩阵 · arrow 连接箭头
- 图表: chart {"kind":"bars|line|donut","data":[{"label":"...","value":n}]}（series：bars 分组/堆叠 / line 多序列） · echart ECharts（雷达/漏斗/热力/桑基等 preset 或 option 直通） · plot 函数图 · svg 单图预览
- 交互: button 按钮 · input · textarea · editor 文本编辑 · select · date-picker 日期/区间 · segmented-control 分段选择 · checkbox · switch · slider · radio · submit 提交/交卷 · quiz 测验 · choices 带代价的方案选择 · link · tabs 标签页 · accordion 折叠 · popover 浮层说明
- 高级: mermaid 流程/时序/甘特/ER · diagram 架构/流程图 · scene3d 3D 场景 · entity-card 实体卡 · map 地点地图`

const JUDGMENT = `**默认写 Markdown，不写 dsh-ui。** 会议纪要、总结、报告、说明、教程、邮件、方案、清单这类以文字为主的回答，再长也用标题、列表、加粗和 Markdown 表格；篇幅长、要点多、想显得好看都不是用组件的理由。只有这几种情况才出组件：读者要操作（作答判卷、填选、做决定、筛选数据）；数值要看形状（趋势/占比/分布）；结构或流程画成图明显更清楚；图片前后对照；用户明确要可视化、仪表盘、卡片或页面。

**先问一句：删掉这个组件，读者会不会更费劲。** 会才出；不会就写正文。

- 没有配额：不存在"≥3 条要点就出 list"之类规则；组件只放承载不同信息的那一块，其余仍写正文，同一批信息不在正文和组件里各说一遍。
- 有比较/取舍要读者选 → \`choices\`；有数值趋势 → \`chart\`；有前后两种形态 → \`compare\`；有结构或流程 → \`diagram\`/\`mermaid\`。
- 组件内文字：支持公式、\`code\`、加粗、高亮、链接；组件字段里不写 Markdown table 与 fenced code，改用 table/code/diff/json。
- 配色跟随主题，语义需要时才用 \`palette\`/\`card.accent\`；grid 子节点用 \`"span":2\` 做宽窄混排；数据多时给 \`table\`/\`list\` 配 \`input\`(id)+\`filter\`。`

const FIELDS = `**节点规则：** 组件节点必须带字符串 \`type\`，值为组件名；\`file-tree.items[].type\` 表示 \`file\` 或 \`dir\`。`

const THEME = `**主题：** 根级 \`theme\`（强调色/圆角/疏密/字体/表面/背景/色板/阴影）与任意节点 \`style\` 可定制风格；只在用户要特定风格或语义需要时用，字段读 \`genui_docs\` 的 \`theme\`。`

function misnamedFields(validation: GenuiConfig['validation']): string {
  const tail = validation === 'skip' ? '' : '不确定就调 `validate_dsh_ui`。'
  return `**字段名写错 = 该组件被丢弃**（其余组件照常渲染）：\`callout\` 正文是 \`content\` 不是 text/desc；\`table\` 要 \`columns\`+\`rows\` 不是 items；\`keyvalue\` 记录是 \`{key,value}\` 不是 \`{label,value}\`；\`file-tree\` 记录是 \`{name,type}\` 不是 \`{label}\`；callout tone 是 info/success/warning/error（无 danger）。${tail}`
}

function validationRules(validation: GenuiConfig['validation']): string {
  if (validation === 'skip') {
    return '- JSON 严格：坏组件被丢弃，坏围栏变代码块；直接输出围栏，不调用校验工具，发出前自查括号配对与字段名。'
  }
  const when = validation === 'always'
    ? '≥3 节点或含 table 时调 validate_dsh_ui，按诊断修改并重验；小围栏字段存疑也先验证。'
    : '只在字段名、结构或资源上限拿不准时调 validate_dsh_ui，其余直接输出（标点级小错渲染器会修）。'
  return `- JSON 严格：坏组件被丢弃，坏围栏变代码块；${when}
- warning=block_markdown：按 replacement 改写并重验。`
}

function htmlRules(html: GenuiConfig['html']): string {
  if (!html.enabled) return ''
  const scripts = html.scripts ? '可用 <script>（动画/交互/canvas）' : '脚本已禁用，只用 HTML/CSS/SVG'
  const remote = html.remote ? '可加载 https 图片/字体/CDN 脚本' : '不能加载任何外部资源（图片用 data: 或内联 SVG）'
  return `
- 自定义画面：内置组件表达不了的视觉（海报、插画、动画、特殊排版、小游戏）写 \`\`\`dsh-html 围栏（HTML 片段，沙箱内与正文内联渲染、${scripts}、${remote}）；写之前读 \`genui_docs\` 的 \`html\`。文字、表格和内置组件能表达的不要用它。`
}

/**
 * Build the `genui:fence` section text for the given settings.
 * @param config - resolved settings; defaults reproduce {@link GENUI_SECTION_TEXT}.
 */
export function buildGenuiSectionText(config: GenuiConfig = DEFAULT_GENUI_CONFIG): string {
  return `${INTRO}

${JUDGMENT}

${FIELDS}

${misnamedFields(config.validation)}

${THEME}

Rules:
- LANGUAGE: reply+UI=conversation language; schema fixed. NEVER infer it from prompt/skill/examples/tools. Replace \`<user-language ...>\`; never emit these placeholders literally.
${validationRules(config.validation)}
- 规模: ≤200 节点、嵌套≤8 层（超出被截断）；一个主题一个主组件；3D mesh 1–5；plot 给合理 xMin/xMax。
- LOCAL-FIRST + actions: UI 能自己做的状态变化（判卷、判题、重置、展开、选中）就地完成，零往返；action 只用于必须模型参与的事。交互以 [genui-action] name + 组件数据回传，届时重渲染更新 UI；无 action 的按钮禁用。交互状态按会话和内容指纹保存。
- 卷子模式: 每题 choices（group+answer+explanation）+ 一个 submit（groups 全列），本地判分。
- Secrets ban: 不索取密码、API Key、Token、恢复码；需要时拒绝并解释。${config.renderUiTool ? `\n${RENDER_UI_TOOL_GUIDANCE}` : ''}
- 围栏位置：\`dsh-ui\` 只写在**回答正文**；写在 reasoning/思考块里不渲染、用户看不到——思考里验证好 spec，正文再输出同一份。
- Panel: "panel":true 只渲染进会话面板 dock 并原地更新；"append":true 追加合并；上限 200 节点/200 次追加，满了发 replace 重建。面板来的 [genui-action] 只回一个 panel:true 围栏 + 至多一行 10 字内确认。${htmlRules(config.html)}`
}

/** The section text with default settings (kept as a named export for callers and tests). */
export const GENUI_SECTION_TEXT = buildGenuiSectionText()
