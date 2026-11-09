/**
 * "Export answer" in a finished assistant message's action row (fork:
 * forever-lwy). One click downloads the answer as HTML with its rendering;
 * progress and failures show as the button's tooltip text and a short note.
 * @module @forever-lwy/dsh-genui/client/answer-export-action
 */
import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { AnswerExportError, downloadAnswerHtml } from './answer-export.ts'
import { useClientConfig } from './client-config.ts'
import { useT } from './i18n/index.ts'

const STYLE_ID = 'dsh-genui-answer-export-style'
const STYLES = `
.dgu-export{position:relative;display:inline-flex}
.dgu-export-btn{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;
  border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary,currentColor);background:transparent;cursor:pointer}
.dgu-export-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.dgu-export-btn:disabled{cursor:progress;opacity:.55}
.dgu-export-btn svg{width:16px;height:16px}
.dgu-export-note{position:absolute;top:calc(100% + 4px);left:0;z-index:40;white-space:nowrap;font-size:12px;padding:4px 8px;border-radius:6px;
  background:var(--dsw-alias-bg-elevated,var(--dsw-alias-bg-layer-2,#fff));color:var(--dsw-alias-label-secondary,inherit);
  border:1px solid var(--dsw-alias-border-secondary,rgba(127,127,127,.25));box-shadow:0 4px 16px rgba(0,0,0,.12)}
.dgu-export-note[data-tone=error]{color:var(--dsw-alias-state-error-primary,#d54941)}
`

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const tag = document.createElement('style')
  tag.id = STYLE_ID
  tag.textContent = STYLES
  document.head.appendChild(tag)
}

function ExportIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="M8 2.2v7.1" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 6.4 8 9.4l3-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.9 10.9v1.5a1 1 0 0 0 1 1h8.2a1 1 0 0 0 1-1v-1.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

type TooltipLike = ComponentType<{ label: string; side?: string; children: ReactNode }>

type Phase = { kind: 'idle' } | { kind: 'working' } | { kind: 'error'; message: string }

/** Factory so the host primitives' Tooltip (when present) wraps the button. */
export function createAnswerExportAction(Tooltip?: TooltipLike, sessionTitle?: (sessionId: unknown) => string | undefined) {
  return function AnswerExportAction(props: { messageId?: unknown; sessionId?: unknown }) {
    const t = useT()
    const config = useClientConfig()
    const ref = useRef<HTMLSpanElement>(null)
    const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
    const alive = useRef(true)
    useEffect(() => () => { alive.current = false }, [])
    useEffect(() => {
      if (phase.kind !== 'error') return
      const timer = window.setTimeout(() => { if (alive.current) setPhase({ kind: 'idle' }) }, 5000)
      return () => { window.clearTimeout(timer) }
    }, [phase])
    const run = useCallback(() => {
      const anchor = ref.current
      if (anchor === null || phase.kind === 'working') return
      setPhase({ kind: 'working' })
      const title = sessionTitle?.(props.sessionId)
      downloadAnswerHtml(anchor, title === undefined ? {} : { title }).then(
        () => { if (alive.current) setPhase({ kind: 'idle' }) },
        (error: unknown) => {
          const message = error instanceof AnswerExportError && error.message === 'empty'
            ? t('answer.exportEmpty')
            : t('answer.exportFailed', { message: error instanceof Error ? error.message : String(error) })
          console.warn('[dsh-genui] answer export failed:', error)
          if (alive.current) setPhase({ kind: 'error', message })
        },
      )
    }, [phase.kind, props.sessionId, t])
    if (!config.exportAnswer) return null
    ensureStyles()
    const label = phase.kind === 'working' ? t('answer.exporting') : t('answer.exportHtml')
    const button = (
      <button type="button" className="dgu-export-btn" aria-label={label} title={Tooltip === undefined ? label : undefined}
        disabled={phase.kind === 'working'} onClick={run} data-genui-answer-export="">
        <ExportIcon />
      </button>
    )
    return (
      <span className="dgu-export" ref={ref}>
        {Tooltip !== undefined && phase.kind === 'idle' ? <Tooltip label={label} side="bottom">{button}</Tooltip> : button}
        {phase.kind === 'working' && <span className="dgu-export-note" role="status">{t('answer.exporting')}</span>}
        {phase.kind === 'error' && <span className="dgu-export-note" data-tone="error" role="alert">{phase.message}</span>}
      </span>
    )
  }
}
