import { StrictMode } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createNativeFenceLayer, installNativeFenceRenderer } from '../src/client/native-fence.tsx'
import { fenceStateKey, saveBlockState } from '../src/client/interaction-store.ts'
import { clearSessionPanel, getPanelSpec } from '../src/client/panel-store.ts'
import { resolveGenuiSpec } from '../src/client/fence-render.tsx'
import * as fenceRender from '../src/client/fence-render.tsx'
import { useGenuiAction } from '../src/client/action-context.ts'

const availability = { subscribe: () => () => {}, getSnapshot: () => false }
const ctx = { get: () => undefined } as never
const text = JSON.stringify({ items: [{ type: 'text', content: 'Native fence content' }] })
const form = JSON.stringify({ items: [{ type: 'input', id: 'choice', label: 'Choice' }, { type: 'submit', label: 'Send', action: 'continue' }] })
const sessionId = 'native-fence-test' as never
const anchor = '14:assistant-step1:2'
const layers: ReturnType<typeof createNativeFenceLayer>[] = []
function fixture({ code = text, lang = 'dsh-ui', streaming = false, session = sessionId, wrapper = 'assistant-step', reasoning = false } = {}) {
  const send = vi.fn()
  const Layer = createNativeFenceLayer(ctx, send, availability)
  layers.push(Layer)
  const tree = (body = code, pending = streaming, identity = session) => <div data-chat-flow-kind={wrapper} data-chat-anchor-key={anchor}>
    <div {...(reasoning ? { 'data-chat-group-part': 'reasoning' } : {})}>
      <Layer code={body} lang={lang} streaming={pending} sessionId={identity}><pre data-native-fallback>{body}</pre></Layer>
    </div>
  </div>
  const view = render(tree())
  return { ...view, send, tree }
}

beforeEach(() => localStorage.clear())
afterEach(() => { cleanup(); clearSessionPanel(sessionId); layers.length = 0; vi.restoreAllMocks() })

describe('native Markdown fence extension', () => {
  it('registers only its three languages, follows the slot lifetime, and starts no DOM observer', () => {
    const observe = vi.spyOn(globalThis, 'MutationObserver')
    const register = vi.fn(() => vi.fn())
    const release = vi.fn()
    const inject = vi.fn((_name, mount) => { mount(); return release })
    const dispose = installNativeFenceRenderer({ slots: { inject, register } } as never, vi.fn(), availability)
    expect(register.mock.calls.map(([options]) => options.key)).toEqual(['dsh-ui', 'dsh-html', 'svg'])
    expect(register.mock.calls.every(([options]) => options.name === 'conversation.chat.markdown.fence')).toBe(true)
    expect(observe).not.toHaveBeenCalled()
    dispose()
    expect(release).toHaveBeenCalledTimes(3)
  })

  it('renders in the host React tree and routes actions to its own session', async () => {
    const view = fixture({ code: form })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'owned' } })
    fireEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(view.send).toHaveBeenCalledExactlyOnceWith(sessionId, 'continue', { type: 'submit', fields: { choice: 'owned' }, answers: {}, answered: 1, total: 1 })
    expect(document.querySelector('[data-native-fallback]')).toBeNull()
    view.unmount()
    expect(document.querySelector('[data-genui]')).toBeNull()
  })

  it.each([['user', false], ['tool', false], ['assistant-step', true]])('keeps %s / reasoning=%s fences as native code', (wrapper, reasoning) => {
    fixture({ wrapper, reasoning })
    expect(document.querySelector('[data-native-fallback]')?.textContent).toBe(text)
    expect(document.querySelector('[data-genui]')).toBeNull()
  })

  it('renders completed streaming components and keeps malformed settled code with a visible diagnostic', () => {
    const view = fixture({ code: '{"items":[{"type":"text","content":"Streaming"},', streaming: true })
    expect(document.querySelector('[data-genui]')?.textContent).toContain('Streaming')
    view.rerender(view.tree('not a valid GenUI document', false))
    expect(document.querySelector('[data-native-fallback]')?.textContent).toBe('not a valid GenUI document')
    expect(screen.getByRole('alert')).toBeDefined()
  })

  it('keeps legacy durable state keys across the native-channel migration and isolates sessions', () => {
    const spec = resolveGenuiSpec(form, { source: { id: 'legacy', order: [1, 0, 0] } })
    saveBlockState(fenceStateKey(sessionId, `dom:${anchor}:1`, JSON.stringify(spec)), { fields: { choice: 'restored' } })
    const view = fixture({ code: form })
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('restored')
    view.rerender(view.tree(form, false, 'other-session' as never))
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('')
  })

  it('keeps repeated fence bodies in separate durable slots', () => {
    const spec = resolveGenuiSpec(form, { source: { id: 'legacy', order: [1, 0, 0] } })
    saveBlockState(fenceStateKey(sessionId, `dom:${anchor}:2`, JSON.stringify(spec)), { fields: { choice: 'second' } })
    const Layer = createNativeFenceLayer(ctx, vi.fn(), availability)
    render(<div data-chat-flow-kind="assistant-step" data-chat-anchor-key={anchor}>
      <pre>Ordinary JSON remains a host code block</pre>
      {[1, 2].map(key => <Layer key={key} code={form} lang="dsh-ui" streaming={false} sessionId={sessionId}><pre>{form}</pre></Layer>)}
    </div>)
    const fields = screen.getAllByRole('textbox') as HTMLInputElement[]
    expect(fields.map(field => field.value)).toEqual(['', 'second'])
  })

  it('preserves typed fields while tokens arrive and when streaming settles', () => {
    const view = fixture({ code: form, streaming: true })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'keep while streaming' } })
    const updated = JSON.stringify({ items: [...JSON.parse(form).items, { type: 'text', content: 'New streamed content' }] })
    view.rerender(view.tree(updated, true))
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('keep while streaming')
    view.rerender(view.tree(updated, false))
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('keep while streaming')
  })

  it('publishes a panel only after settling and deduplicates StrictMode remounts', async () => {
    const code = JSON.stringify({ panel: true, items: [{ type: 'text', content: 'Panel content' }] })
    const Layer = createNativeFenceLayer(ctx, vi.fn(), availability)
    const tree = streaming => <StrictMode><div data-chat-flow-kind="assistant-step" data-chat-anchor-key={anchor}>
      <Layer code={code} lang="dsh-ui" streaming={streaming} sessionId={sessionId}><pre>{code}</pre></Layer>
    </div></StrictMode>
    const view = render(tree(true))
    expect(getPanelSpec(sessionId)).toBeNull()
    view.rerender(tree(false))
    await waitFor(() => expect(getPanelSpec(sessionId)?.items).toHaveLength(1))
    view.unmount()
    render(tree(false))
    expect(getPanelSpec(sessionId)?.items).toHaveLength(1)
  })

  it('keeps SVG as code while streaming and renders it when settled', () => {
    const code = '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="3"/></svg>'
    const view = fixture({ code, lang: 'svg', streaming: true })
    expect(document.querySelector('[data-native-fallback]')).not.toBeNull()
    view.rerender(view.tree(code, false))
    expect(document.querySelector('[data-genui-svg-fence]')).not.toBeNull()
  })

  it('lets the host own removal without rebuilding roots or retaining a fence observer', () => {
    const view = fixture()
    expect(document.querySelector('[data-genui]')).not.toBeNull()
    view.rerender(<div>Host replaced this message</div>)
    expect(document.querySelector('[data-genui]')).toBeNull()
    expect(screen.getByText('Host replaced this message')).toBeDefined()
  })

  it('closes retained action callbacks on session switches and unmount', () => {
    const callbacks: NonNullable<ReturnType<typeof useGenuiAction>>[] = []
    function CaptureAction() {
      const action = useGenuiAction()
      if (action) callbacks.push(action)
      return <div>Action callback fixture</div>
    }
    vi.spyOn(fenceRender, 'renderResolvedFenceNode').mockImplementation(() => <CaptureAction />)
    const view = fixture()
    const oldAction = callbacks.at(-1)!
    view.rerender(view.tree(text, false, 'other-session' as never))
    oldAction('stale-action', {})
    expect(view.send).not.toHaveBeenCalled()
    const currentAction = callbacks.at(-1)!
    currentAction('current-action', {})
    expect(view.send).toHaveBeenCalledExactlyOnceWith('other-session', 'current-action', {})
    view.unmount()
    currentAction('after-unmount', {})
    expect(view.send).toHaveBeenCalledTimes(1)
  })
})
