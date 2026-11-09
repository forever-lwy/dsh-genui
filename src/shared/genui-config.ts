/**
 * Plugin settings shared by both halves (fork: forever-lwy): types, defaults
 * and the resolver. The schemastery schema lives in `plugin/config.ts` so the
 * browser bundle never pulls a schema library in.
 * @module @forever-lwy/dsh-genui/shared/genui-config
 */
/** How the prompt asks the model to use `validate_dsh_ui` before a fence. */
export type GenuiValidationMode = 'always' | 'uncertain' | 'skip'

export interface GenuiHtmlConfig {
  /** Teach and render ```dsh-html fences (sandboxed iframe, inline). */
  enabled: boolean
  /** Allow the fence's own `<script>`s. Off = static HTML/CSS/SVG only. */
  scripts: boolean
  /** Allow https: images, fonts, styles and scripts (e.g. a CDN library). */
  remote: boolean
  /** Upper bound of the auto-sized frame height in px; taller content scrolls inside. */
  maxHeight: number
}

export interface GenuiConfig {
  validation: GenuiValidationMode
  /** Same-turn correction request when a final fence cannot render. */
  fenceFeedback: boolean
  /** Register the `render_ui` tool (renders as a separate tool card). */
  renderUiTool: boolean
  html: GenuiHtmlConfig
  /** Show the "export this answer" button under finalized assistant messages. */
  exportAnswer: boolean
}

export const DEFAULT_GENUI_CONFIG: GenuiConfig = Object.freeze({
  validation: 'always',
  fenceFeedback: true,
  renderUiTool: false,
  html: Object.freeze({ enabled: true, scripts: true, remote: false, maxHeight: 2400 }),
  exportAnswer: true,
}) as GenuiConfig

const SECTIONS = ['validation', 'fenceFeedback', 'renderUiTool', 'html', 'exportAnswer'] as const

const d = DEFAULT_GENUI_CONFIG
const read = (value: unknown): unknown =>
  value !== null && typeof value === 'object' && typeof (value as { get?: unknown }).get === 'function'
    ? (value as { get: () => unknown }).get()
    : value

const bool = (value: unknown, fallback: boolean): boolean => typeof value === 'boolean' ? value : fallback

/**
 * Resolve the row's config (volatile references or plain values, possibly
 * partial or absent) into a complete, detached settings object.
 */
export function snapshotGenuiConfig(raw: unknown): GenuiConfig {
  const source = (raw !== null && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const key of SECTIONS) out[key] = read(source[key])
  const validation = out.validation === 'uncertain' || out.validation === 'skip' || out.validation === 'always'
    ? out.validation
    : d.validation
  const html = (out.html !== null && typeof out.html === 'object' ? out.html : {}) as Partial<GenuiHtmlConfig>
  const maxHeight = typeof html.maxHeight === 'number' && Number.isFinite(html.maxHeight)
    ? Math.min(10000, Math.max(200, Math.round(html.maxHeight)))
    : d.html.maxHeight
  return {
    validation,
    fenceFeedback: bool(out.fenceFeedback, d.fenceFeedback),
    renderUiTool: bool(out.renderUiTool, d.renderUiTool),
    html: {
      enabled: bool(html.enabled, d.html.enabled),
      scripts: bool(html.scripts, d.html.scripts),
      remote: bool(html.remote, d.html.remote),
      maxHeight,
    },
    exportAnswer: bool(out.exportAnswer, d.exportAnswer),
  }
}
