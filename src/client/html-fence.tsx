/**
 * ```dsh-html fences: the model's own HTML/CSS (and, when enabled, scripts)
 * drawn inline in the reply (fork: forever-lwy).
 *
 * The frame is borderless and transparent, as wide as the text column and as
 * tall as its content (up to the configured maximum, then it scrolls inside),
 * so prose before and after reads as one flow — no card around it. While the
 * reply streams, a one-line placeholder stands in for the growing code block;
 * the frame is built once the fence settles.
 *
 * See html-frame.ts for the sandbox and CSP. Here: the parent half — size and
 * theme messages, the user-gesture gate on `dsh.action`, and a guard that
 * restores the content when the frame navigates itself away.
 * @module @forever-lwy/dsh-genui/client/html-fence
 */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Key } from 'react'
import { CodeBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import { useGenuiAction } from './action-context.ts'
import { useClientConfig } from './client-config.ts'
import { onHostThemeChange, readHostTheme } from './host-theme.ts'
import { buildHtmlFrameDocument, FRAME_MESSAGE_TAG, FRAME_SANDBOX, randomToken, type HtmlFrameTheme } from './html-frame.ts'
import { useT } from './i18n/index.ts'
import { codeBlockLabels } from './primitive-labels.ts'

/** What the answer exporter needs from a mounted frame. */
export interface HtmlFrameRecord {
  raw: string
  scripts: boolean
  remote: boolean
  height: number
}

const records = new WeakMap<Element, () => HtmlFrameRecord>()

/** The source behind a `[data-genui-html]` element, for the answer exporter. */
export function htmlFrameRecordOf(element: Element): HtmlFrameRecord | undefined {
  return records.get(element)?.()
}

const STYLE_ID = 'dsh-genui-html-fence-style'
const STYLES = `
[data-genui-html]{position:relative;margin:10px 0;min-width:0}
[data-genui-html] > iframe{display:block;width:100%;border:0;background:transparent;color-scheme:normal}
[data-genui-html]:fullscreen{background:var(--dsw-alias-bg-base,Canvas);padding:16px;overflow:auto}
[data-genui-html]:fullscreen > iframe{height:calc(100vh - 32px) !important;max-height:none !important}
.genui-html-tools{position:absolute;top:4px;right:4px;display:flex;gap:4px;opacity:0;transition:opacity .15s;z-index:1}
[data-genui-html]:hover .genui-html-tools,[data-genui-html]:focus-within .genui-html-tools{opacity:1}
.genui-html-tools button{font:inherit;font-size:12px;line-height:1;padding:5px 8px;border-radius:6px;cursor:pointer;
  color:var(--dsw-alias-label-secondary,inherit);background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,Canvas) 88%,transparent);
  border:1px solid color-mix(in srgb,var(--dsw-alias-label-primary,CanvasText) 14%,transparent);backdrop-filter:blur(6px)}
.genui-html-tools button:hover{color:var(--dsw-alias-label-primary,inherit)}
.genui-html-drawing{display:flex;align-items:center;gap:8px;padding:10px 2px;font-size:13px;color:var(--dsw-alias-label-tertiary,GrayText)}
.genui-html-drawing::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-state-business-primary,#4f8ef7);animation:genui-html-pulse 1.2s ease-in-out infinite}
@keyframes genui-html-pulse{0%,100%{opacity:.25}50%{opacity:1}}
@media (prefers-reduced-motion: reduce){.genui-html-drawing::before{animation:none}}
.genui-html-note{font-size:12px;color:var(--dsw-alias-label-tertiary,GrayText);margin:4px 2px 0}
.genui-html-note[data-tone=error]{color:var(--dsw-alias-state-error-primary,#d54941)}
`

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID) !== null) return
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.textContent = STYLES
  document.head.appendChild(tag)
}

/** Initial height before the first size report: avoids a 150px jump for short content. */
const INITIAL_HEIGHT = 80
/** Minimum spacing between relayed actions from one frame. */
const ACTION_INTERVAL_MS = 1500

function hasUserActivation(): boolean {
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation
  // Activation in a child frame propagates to its ancestors, so the parent
  // sees the click that happened inside the sandbox. Browsers without the API
  // fall back to the rate limit alone.
  return activation === undefined ? true : activation.isActive
}

function HtmlFence({ raw, settled }: { raw: string; settled: boolean }) {
  const t = useT()
  const config = useClientConfig()
  const onAction = useGenuiAction()
  const rootRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const frameId = useMemo(() => randomToken(), [])
  const [height, setHeight] = useState(INITIAL_HEIGHT)
  const [source, setSource] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const [blocked, setBlocked] = useState(false)
  const [generation, setGeneration] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const themeRef = useRef<HtmlFrameTheme | undefined>(undefined)
  const lastAction = useRef(0)
  const { scripts, remote, maxHeight } = config.html

  ensureStyles()

  // Theme is read once per built document; later switches go by message.
  const srcDoc = useMemo(() => {
    if (!settled) return ''
    const theme = readHostTheme(rootRef.current?.parentElement ?? null)
    themeRef.current = theme
    return buildHtmlFrameDocument(raw, { frameId, scripts, remote, theme })
    // `generation` rebuilds after a blocked navigation.
  }, [raw, settled, frameId, scripts, remote, generation])

  useLayoutEffect(() => {
    const element = rootRef.current
    if (element === null) return
    records.set(element, () => ({ raw, scripts, remote, height }))
    return () => { records.delete(element) }
  }, [raw, scripts, remote, height])

  useEffect(() => {
    if (!settled) return
    const receive = (event: MessageEvent): void => {
      const frame = frameRef.current
      if (frame === null || event.source !== frame.contentWindow) return
      const data = event.data as Record<string, unknown> | null
      if (data === null || typeof data !== 'object' || data[FRAME_MESSAGE_TAG] !== frameId) return
      if (data.type === 'size' && typeof data.height === 'number' && Number.isFinite(data.height)) {
        setHeight(Math.max(1, Math.min(maxHeight, Math.ceil(data.height))))
      } else if (data.type === 'error' && typeof data.message === 'string') {
        setError(data.message.slice(0, 300))
      } else if (data.type === 'action' && typeof data.name === 'string' && onAction !== undefined) {
        const now = Date.now()
        // A click inside the frame moves focus into it; a script posting on its
        // own (or while the user types elsewhere) leaves focus outside.
        if (now - lastAction.current < ACTION_INTERVAL_MS || document.activeElement !== frame || !hasUserActivation()) return
        lastAction.current = now
        const name = data.name.trim().slice(0, 80)
        if (name === '') return
        const payload = data.data !== null && typeof data.data === 'object' && !Array.isArray(data.data)
          ? data.data as Record<string, unknown>
          : {}
        onAction(name, payload)
      }
    }
    window.addEventListener('message', receive)
    return () => { window.removeEventListener('message', receive) }
  }, [settled, frameId, maxHeight, onAction])

  // Live theme: one shared observer, a message only when values changed.
  useEffect(() => {
    if (!settled) return
    return onHostThemeChange(() => {
      const next = readHostTheme(rootRef.current?.parentElement ?? null)
      if (JSON.stringify(next) === JSON.stringify(themeRef.current)) return
      themeRef.current = next
      frameRef.current?.contentWindow?.postMessage({ [FRAME_MESSAGE_TAG]: frameId, type: 'theme', vars: next.vars, scheme: next.scheme }, '*')
    })
  }, [settled, frameId])

  useEffect(() => {
    const update = (): void => { setFullscreen(document.fullscreenElement === rootRef.current) }
    document.addEventListener('fullscreenchange', update)
    return () => { document.removeEventListener('fullscreenchange', update) }
  }, [])

  // The first load is our srcdoc; any later one is the frame navigating itself.
  const loads = useRef(0)
  useEffect(() => { loads.current = 0 }, [srcDoc])
  const onLoad = useCallback(() => {
    loads.current++
    if (loads.current > 1) {
      setBlocked(true)
      setGeneration(value => value + 1)
      return
    }
    // The document was built during render, before this element sat inside
    // the reply; re-read the theme where it actually lives.
    const next = readHostTheme(rootRef.current?.parentElement ?? null)
    if (JSON.stringify(next) === JSON.stringify(themeRef.current)) return
    themeRef.current = next
    frameRef.current?.contentWindow?.postMessage({ [FRAME_MESSAGE_TAG]: frameId, type: 'theme', vars: next.vars, scheme: next.scheme }, '*')
  }, [frameId])

  const toggleFullscreen = useCallback(() => {
    const element = rootRef.current
    if (element === null) return
    if (document.fullscreenElement === element) void document.exitFullscreen().catch(() => {})
    else void element.requestFullscreen?.().catch(() => {})
  }, [])

  if (!config.html.enabled) {
    return (
      <div ref={rootRef} data-genui-html="" data-genui-html-disabled="">
        <CodeBlock {...codeBlockLabels()} code={raw} lang="html" />
        <p className="genui-html-note">{t('html.disabled')}</p>
      </div>
    )
  }

  if (!settled) {
    const lines = raw.split('\n').length
    return (
      <div ref={rootRef} data-genui-html="" data-streaming-html="">
        <div className="genui-html-drawing" role="status">{t('html.drawing')} · {lines}</div>
      </div>
    )
  }

  return (
    <div ref={rootRef} data-genui-html="" aria-label={t('html.label')} role="group">
      <div className="genui-html-tools">
        <button type="button" aria-pressed={source} onClick={() => { setSource(value => !value) }}>
          {source ? t('html.preview') : t('html.source')}
        </button>
        {!source && (
          <button type="button" onClick={toggleFullscreen}>{fullscreen ? t('html.exitFullscreen') : t('html.fullscreen')}</button>
        )}
      </div>
      {source
        ? <CodeBlock {...codeBlockLabels()} code={raw} lang="html" />
        : (
          <iframe
            key={generation}
            ref={frameRef}
            title={t('html.label')}
            sandbox={FRAME_SANDBOX}
            referrerPolicy="no-referrer"
            allow="fullscreen"
            srcDoc={srcDoc}
            onLoad={onLoad}
            style={{ height: `${height}px`, maxHeight: `${maxHeight}px` }}
          />
        )}
      {blocked && <p className="genui-html-note" role="status">{t('html.navigationBlocked')}</p>}
      {error !== undefined && !source && <p className="genui-html-note" data-tone="error" role="status">{t('html.scriptError', { message: error })}</p>}
    </div>
  )
}

export function renderHtmlFence(raw: string, key: Key, settled: boolean) {
  return <HtmlFence key={key} raw={raw} settled={settled} />
}
