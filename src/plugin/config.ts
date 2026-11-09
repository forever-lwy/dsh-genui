/**
 * Plugin settings schema (fork: forever-lwy).
 *
 * Every field is volatile: DSH 0.2.2's settings form only exposes volatile
 * fields, and the loader then updates them in place (`loader/volatile-update`)
 * instead of remounting the plugin. The host half therefore reads the
 * settings through {@link snapshotGenuiConfig} at each use; the browser half
 * reads the same row through `configForms`.
 * @module @forever-lwy/dsh-genui/plugin/config
 */
import z from '@deepseek-ai/schemastery'
import { DEFAULT_GENUI_CONFIG, type GenuiConfig } from '../shared/genui-config.ts'

export { DEFAULT_GENUI_CONFIG, snapshotGenuiConfig } from '../shared/genui-config.ts'
export type { GenuiConfig, GenuiHtmlConfig, GenuiValidationMode } from '../shared/genui-config.ts'

const d = DEFAULT_GENUI_CONFIG

export const Config: z<GenuiConfig> = z.object({
  validation: z.union(['always', 'uncertain', 'skip'] as const).default(d.validation).volatile()
    .description('生成 UI 前的校验：always 复杂围栏先调 validate_dsh_ui / uncertain 只在拿不准时校验 / skip 跳过校验并不注册校验工具'),
  fenceFeedback: z.boolean().default(d.fenceFeedback).volatile()
    .description('最终围栏无法渲染时，在同一回合请求模型发送一次修正版'),
  renderUiTool: z.boolean().default(d.renderUiTool).volatile()
    .description('注册 render_ui 工具（渲染为独立的工具卡片；关闭后只用正文内联围栏）'),
  html: z.object({
    enabled: z.boolean().default(d.html.enabled).description('允许 ```dsh-html 自定义画面（沙箱 iframe，内联在回答中）'),
    scripts: z.boolean().default(d.html.scripts).description('允许画面中的脚本（动画、交互、canvas）'),
    remote: z.boolean().default(d.html.remote).description('允许加载 https 外部资源（图片、字体、CDN 脚本）'),
    maxHeight: z.natural().min(200).max(10000).default(d.html.maxHeight).description('画面自适应高度上限（像素）'),
  }).volatile().description('自定义 HTML 画面'),
  exportAnswer: z.boolean().default(d.exportAnswer).volatile()
    .description('在回答操作栏显示“导出回答”按钮（保留渲染效果的 HTML）'),
}) as unknown as z<GenuiConfig>

