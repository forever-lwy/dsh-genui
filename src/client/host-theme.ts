/**
 * Host theme → plain CSS values for sandboxed frames (fork: forever-lwy).
 *
 * A `dsh-html` frame is a separate document: the host's `--dsw-*` tokens do
 * not cascade into it. The values are resolved here (a probe element inside
 * the reply, so scoped overrides apply) and sent as `--dsh-*` variables. One
 * shared observer watches the attributes theme switches touch on <html> and
 * <body> and notifies every frame once per frame-time when the values change.
 * @module @forever-lwy/dsh-genui/client/host-theme
 */
import type { HtmlFrameTheme } from './html-frame.ts'

/** Frame variable → host colour expression (first resolvable wins). */
const COLOR_TOKENS: Record<string, string> = {
  '--dsh-fg': 'var(--dsw-alias-label-primary, CanvasText)',
  '--dsh-muted': 'var(--dsw-alias-label-secondary, GrayText)',
  '--dsh-bg': 'var(--dsw-alias-bg-base, var(--dsw-alias-bg-layer-0, var(--dsw-alias-bg-layer-1, Canvas)))',
  '--dsh-surface': 'var(--dsh-genui-surface, var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1, Canvas)))',
  '--dsh-border': 'var(--dsw-alias-border-l1, var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.25)))',
  '--dsh-accent': 'var(--dsw-alias-state-business-primary, #4f8ef7)',
}

function luminance(color: string): number | undefined {
  const match = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/u.exec(color)
  if (match === null) return undefined
  const [r, g, b] = match.slice(1, 4).map(part => Number(part) / 255) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Resolve the frame theme as seen from `anchor` (inside the reply). */
export function readHostTheme(anchor: Element | null): HtmlFrameTheme {
  const doc = anchor?.ownerDocument ?? (typeof document === 'undefined' ? undefined : document)
  const vars: Record<string, string> = {}
  if (doc === undefined) return { vars, scheme: 'light' }
  const host = anchor instanceof HTMLElement ? anchor : doc.body
  const probe = doc.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none'
  host.appendChild(probe)
  try {
    for (const [name, expression] of Object.entries(COLOR_TOKENS)) {
      probe.style.color = ''
      probe.style.color = expression
      const value = getComputedStyle(probe).color
      if (value !== '') vars[name] = value
    }
    const hostStyle = getComputedStyle(host)
    vars['--dsh-font'] = hostStyle.fontFamily || 'system-ui, sans-serif'
    vars['--dsh-font-size'] = hostStyle.fontSize || '15px'
    probe.style.fontFamily = 'var(--ds-font-family-code, ui-monospace, "SF Mono", Menlo, Consolas, monospace)'
    vars['--dsh-mono'] = getComputedStyle(probe).fontFamily || 'ui-monospace, monospace'
  } finally {
    probe.remove()
  }
  const fg = luminance(vars['--dsh-fg'] ?? '')
  return { vars, scheme: fg !== undefined && fg > 0.55 ? 'dark' : 'light' }
}

const listeners = new Set<() => void>()
let observer: MutationObserver | undefined
let media: MediaQueryList | undefined
let frame = 0

function notify(): void {
  if (frame !== 0) return
  frame = requestAnimationFrame(() => {
    frame = 0
    for (const listener of [...listeners]) listener()
  })
}

/** Call `listener` after anything that may have switched the host theme. */
export function onHostThemeChange(listener: () => void): () => void {
  listeners.add(listener)
  if (observer === undefined && typeof MutationObserver === 'function' && typeof document !== 'undefined') {
    observer = new MutationObserver(notify)
    const options = { attributes: true, attributeFilter: ['class', 'style', 'data-theme', 'data-ds-dark-theme', 'data-color-scheme'] }
    observer.observe(document.documentElement, options)
    if (document.body !== null) observer.observe(document.body, options)
    if (typeof matchMedia === 'function') {
      media = matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener?.('change', notify)
    }
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      observer?.disconnect()
      observer = undefined
      media?.removeEventListener?.('change', notify)
      media = undefined
      if (frame !== 0) cancelAnimationFrame(frame)
      frame = 0
    }
  }
}
