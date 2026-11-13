/** Real rc.3 Slot renderer and primitives; synthetic messages, no model calls. */
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'
import * as ReactDOM from 'react-dom'
import * as ReactDOMClient from 'react-dom/client'
import * as cordis from '@deepseek-ai/cordis'
import * as slotsCore from '@deepseek-ai/dsh-client-ui-slots'
import { FenceCodeBlock } from '@deepseek-ai/dsh-client-ui-primitives'
import { installNativeFenceRenderer } from '../../src/client/native-fence.tsx'
import { getPanelSpec } from '../../src/client/panel-store.ts'
import { STANDALONE_THEME_CSS } from '../../src/client/artifact/standalone-theme.ts'
import { codeBlockLabels } from '../../src/client/primitive-labels.ts'

const style = document.createElement('style')
style.textContent = STANDALONE_THEME_CSS + 'body{font:15px system-ui;max-width:760px;margin:24px auto;padding:16px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary)}[data-chat-flow-kind]{padding:18px;border:1px solid #8884;margin:12px 0;border-radius:12px}pre{white-space:pre-wrap}'
document.head.append(style)
const modules = { react: React, 'react/jsx-runtime': jsxRuntime, 'react-dom': ReactDOM, 'react-dom/client': ReactDOMClient,
  '@deepseek-ai/cordis': cordis, '@deepseek-ai/dsh-client-ui-slots': slotsCore }
let renderer
window.__ModuleLoader__ = { load: ({ factory }) => { renderer = factory(name => {
  if (!(name in modules)) throw new Error(`Unexpected host dependency ${name}`)
  return modules[name]
}) } }
const response = await fetch('/__host-renderer.js')
if (!response.ok) throw new Error('Host renderer bundle is unavailable')
new Function(await response.text())()
const ctx = new cordis.Context()
await ctx.plugin(renderer)
function atom(initial) {
  let value = initial
  const listeners = new Set<() => void>()
  return { getSnapshot: () => value, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) },
    set: next => { value = next; for (const listener of listeners) listener() } }
}
const binding = atom({ key: 'browser-session', ctx, hooks: {}, keyedHooks: {}, props: { sessionId: 'browser-session' } })
ctx.slots.installScope('session', { current: binding, bindingSource: () => binding,
  renderArea: (_value, { children }) => <>{children}</> })
ctx.slots.provideRoot({ hooks: {} })
const state = atom({ lang: 'dsh-ui', code: JSON.stringify({ title: 'Native fence', items: [
  { type: 'text', content: 'DSH rc.3 native Markdown extension' },
  { type: 'input', id: 'choice', label: 'Choice' }, { type: 'submit', label: 'Send', action: 'continue' },
] }), streaming: true })
function Shell({ renderSlot }) {
  const value = React.useSyncExternalStore(state.subscribe, state.getSnapshot)
  return <><h1>GenUI native fence verification</h1><div data-chat-flow-kind="assistant-step" data-chat-anchor-key="14:assistant-step1:0">
    {renderSlot('conversation.chat.markdown.fence', value, { entryKey: value.lang,
      children: <FenceCodeBlock {...value} labels={codeBlockLabels()} diff={false} /> })}
  </div></>
}
ctx.slots.register({ name: 'root', children: { 'conversation.chat.markdown.fence': { kind: 'hoc', scope: 'session' } } }, Shell)
const actions: unknown[] = []
const dispose = installNativeFenceRenderer(ctx, (...args) => actions.push(args), { subscribe: () => () => {}, getSnapshot: () => false })
ctx.uiRenderer.mount(document.getElementById('app'))
window.fixture = { actions, set: patch => state.set({ ...state.getSnapshot(), ...patch }),
  panel: () => getPanelSpec('browser-session'), unload: dispose, ctx }
