/**
 * The GenUI page on the Plugins page (fork: forever-lwy).
 *
 * DSH 0.2.2 generates no form from a plugin schema, so the page is ours. It
 * edits the `genui` row through `configForms` (the same channel the settings
 * dialog uses): edits stay local until Save, every write carries the revision
 * it was read at, and a field set back to its default is unset so it keeps
 * following future defaults.
 * @module @forever-lwy/dsh-genui/client/settings
 */
import { useEffect, useId, useMemo, useState, useSyncExternalStore } from 'react'
import { DEFAULT_GENUI_CONFIG, snapshotGenuiConfig, type GenuiConfig, type GenuiValidationMode } from '../shared/genui-config.ts'
import { t } from './i18n/index.ts'

/** The slice of `@deepseek-ai/dsh-client-ui-settings`'s ConfigForm this page uses. */
export interface GenuiConfigForm {
  getSnapshot(): { status: 'loading' | 'ready' | 'unavailable'; value: unknown; user: unknown; revision: number | undefined; writable: boolean }
  subscribe(listener: () => void): () => void
  mutate(ops: readonly PathOp[], expectedRevision?: number): Promise<boolean>
}

export type PathOp = { op: 'set'; path: string[]; value: unknown } | { op: 'unset'; path: string[] }

const SECTIONS = ['validation', 'fenceFeedback', 'renderUiTool', 'html', 'exportAnswer'] as const

/** Section writes turning `current` into `next` (whole sections; `html` is one volatile object). */
export function settingsDiff(current: GenuiConfig, next: GenuiConfig): PathOp[] {
  return SECTIONS.flatMap((section): PathOp[] => {
    if (JSON.stringify(current[section]) === JSON.stringify(next[section])) return []
    return JSON.stringify(next[section]) === JSON.stringify(DEFAULT_GENUI_CONFIG[section])
      ? [{ op: 'unset', path: [section] }]
      : [{ op: 'set', path: [section], value: next[section] }]
  })
}

const STYLES = `
.dgu-settings{max-width:900px;padding:4px 2px 24px;color:var(--dsw-alias-label-primary,inherit);font-size:14px;line-height:1.6}
.dgu-settings p{margin:6px 0 14px}
.dgu-settings fieldset{border:1px solid var(--dsw-alias-border-primary,#8885);border-radius:12px;padding:14px 16px;margin:16px 0;min-width:0}
.dgu-settings legend{font-weight:600;padding:0 7px}
.dgu-row{display:flex;align-items:flex-start;gap:8px;margin:8px 0 12px;cursor:pointer}
.dgu-row input[type=checkbox],.dgu-row input[type=radio]{margin-top:5px}
.dgu-row>span{display:flex;flex-direction:column}
.dgu-hint,.dgu-row small,.dgu-field small{font-size:12px;color:var(--dsw-alias-label-secondary,#888)}
.dgu-field{display:flex;flex-direction:column;gap:6px;margin:8px 0 12px;max-width:260px}
.dgu-field input{box-sizing:border-box;width:100%;border:1px solid var(--dsw-alias-border-primary,#8886);border-radius:7px;padding:7px 10px;background:var(--dsw-alias-bg-base,transparent);color:inherit;font:inherit}
.dgu-field [aria-invalid=true]{border-color:var(--dsw-alias-state-error-primary,#d54941)}
.dgu-settings button{font:inherit;color:inherit;border:1px solid var(--dsw-alias-border-primary,#8886);background:var(--dsw-alias-bg-secondary,transparent);border-radius:7px;padding:7px 12px;cursor:pointer}
.dgu-settings button:disabled{cursor:default;opacity:.55}
.dgu-settings [data-action=save]{background:var(--dsw-alias-brand-primary,#4d6bfe);color:#fff;border-color:transparent}
.dgu-actions{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.dgu-nested{margin-left:24px}
.dgu-error{color:var(--dsw-alias-state-error-primary,#d54941)}.dgu-success{color:var(--dsw-alias-state-success-primary,#16945f)}
`

function useStyles(): void {
  useEffect(() => {
    const tag = document.createElement('style')
    tag.dataset.genuiSettings = ''
    tag.textContent = STYLES
    document.head.appendChild(tag)
    return () => { tag.remove() }
  }, [])
}

type Status = 'idle' | 'saving' | 'saved' | 'failed'

export function GenuiSettings(props: { form: GenuiConfigForm; view?: 'summary' | 'page' }) {
  useStyles()
  const id = useId()
  const snapshot = useSyncExternalStore(props.form.subscribe.bind(props.form), () => props.form.getSnapshot())
  const accepted = useMemo(() => snapshotGenuiConfig(snapshot.value), [snapshot.value])
  const [draft, setDraft] = useState<GenuiConfig>(accepted)
  const [heightText, setHeightText] = useState(String(accepted.html.maxHeight))
  const [dirty, setDirty] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [heightError, setHeightError] = useState(false)

  useEffect(() => {
    if (dirty) return
    setDraft(accepted)
    setHeightText(String(accepted.html.maxHeight))
  }, [accepted, dirty])

  if (props.view === 'summary') return <>{t('settings.intro')}</>
  if (snapshot.status === 'loading') return <div className="dgu-settings"><p className="dgu-hint">{t('settings.loading')}</p></div>
  if (snapshot.status === 'unavailable') return <div className="dgu-settings"><p className="dgu-hint">{t('settings.unavailable')}</p></div>

  const disabled = !snapshot.writable || status === 'saving'
  const edit = (next: GenuiConfig): void => {
    setDraft(next)
    setDirty(true)
    if (status !== 'saving') setStatus('idle')
  }
  const write = async (ops: PathOp[]): Promise<void> => {
    if (ops.length === 0) { setDirty(false); return }
    setStatus('saving')
    try {
      const ok = await props.form.mutate(ops, snapshot.revision)
      setStatus(ok ? 'saved' : 'failed')
      if (ok) setDirty(false)
    } catch {
      setStatus('failed')
    }
  }
  const save = (): void => {
    const height = /^\d+$/u.test(heightText.trim()) ? Number(heightText.trim()) : NaN
    if (!(height >= 200 && height <= 10000)) { setHeightError(true); return }
    setHeightError(false)
    void write(settingsDiff(accepted, { ...draft, html: { ...draft.html, maxHeight: height } }))
  }
  const reset = (): void => {
    if (!window.confirm(t('settings.resetConfirm'))) return
    const user = snapshot.user !== null && typeof snapshot.user === 'object' ? Object.keys(snapshot.user as object) : []
    void write(user.filter(key => (SECTIONS as readonly string[]).includes(key)).map(key => ({ op: 'unset', path: [key] })))
  }
  const toggle = (checked: boolean, onChange: (value: boolean) => void, label: string, hint: string, nested = false) => (
    <label className={`dgu-row${nested ? ' dgu-nested' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={event => { onChange(event.target.checked) }} />
      <span><span>{label}</span><small>{hint}</small></span>
    </label>
  )
  const modes: GenuiValidationMode[] = ['always', 'uncertain', 'skip']

  return (
    <div className="dgu-settings">
      <p>{t('settings.intro')}</p>
      {!snapshot.writable && <p className="dgu-hint">{t('settings.readOnly')}</p>}
      <fieldset>
        <legend>{t('settings.validation')}</legend>
        {modes.map(mode => (
          <label key={mode} className="dgu-row">
            <input type="radio" name={`${id}-validation`} checked={draft.validation === mode} disabled={disabled}
              onChange={() => { edit({ ...draft, validation: mode }) }} />
            <span><span>{t(`settings.validation.${mode}` as 'settings.validation.always')}</span></span>
          </label>
        ))}
        <p className="dgu-hint">{t('settings.validationHint')}</p>
        {toggle(draft.fenceFeedback, value => { edit({ ...draft, fenceFeedback: value }) }, t('settings.fenceFeedback'), t('settings.fenceFeedbackHint'))}
        {toggle(draft.renderUiTool, value => { edit({ ...draft, renderUiTool: value }) }, t('settings.renderUiTool'), t('settings.renderUiToolHint'))}
      </fieldset>
      <fieldset>
        <legend>{t('settings.html')}</legend>
        {toggle(draft.html.enabled, value => { edit({ ...draft, html: { ...draft.html, enabled: value } }) }, t('settings.htmlEnabled'), t('settings.htmlEnabledHint'))}
        {toggle(draft.html.scripts, value => { edit({ ...draft, html: { ...draft.html, scripts: value } }) }, t('settings.htmlScripts'), t('settings.htmlScriptsHint'), true)}
        {toggle(draft.html.remote, value => { edit({ ...draft, html: { ...draft.html, remote: value } }) }, t('settings.htmlRemote'), t('settings.htmlRemoteHint'), true)}
        <div className="dgu-field dgu-nested">
          <label htmlFor={`${id}-height`}>{t('settings.htmlMaxHeight')}</label>
          <input id={`${id}-height`} type="text" inputMode="numeric" value={heightText} disabled={disabled} aria-invalid={heightError ? true : undefined}
            onChange={event => { setHeightText(event.target.value); setDirty(true); setHeightError(false) }} />
          <small>{t('settings.htmlMaxHeightHint')}</small>
          {heightError && <small className="dgu-error" role="alert">{t('settings.invalidHeight')}</small>}
        </div>
      </fieldset>
      <fieldset>
        <legend>{t('answer.export')}</legend>
        {toggle(draft.exportAnswer, value => { edit({ ...draft, exportAnswer: value }) }, t('settings.exportAnswer'), t('settings.exportAnswerHint'))}
      </fieldset>
      <div className="dgu-actions">
        <button type="button" data-action="save" disabled={disabled || !dirty} onClick={save}>{status === 'saving' ? t('settings.saving') : t('settings.save')}</button>
        <button type="button" disabled={disabled || !dirty} onClick={() => { setDraft(accepted); setHeightText(String(accepted.html.maxHeight)); setDirty(false); setHeightError(false); setStatus('idle') }}>{t('settings.discard')}</button>
        <button type="button" disabled={disabled} onClick={reset}>{t('settings.reset')}</button>
        {status === 'saved' && <span className="dgu-success" role="status">{t('settings.saved')}</span>}
        {status === 'failed' && <span className="dgu-error" role="alert">{t('settings.saveFailed')}</span>}
      </div>
    </div>
  )
}
