/** Native Markdown fence layers. The host owns discovery, streaming and React lifetime. */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import type { HocShare, PropsRuntime, SlotMap } from '@deepseek-ai/dsh-client-ui-slots'
import { GenuiActionContext } from './action-context.ts'
import { FenceDiagnostic, renderResolvedFenceNode, type GenuiFenceContext } from './fence-render.tsx'
import { renderHtmlFence } from './html-fence.tsx'
import { renderSvgFence } from './svg-fence.tsx'
import { withFileLinkContext, type FileLinkAvailability, type FileLinkCordisContext } from './file-link-context.tsx'

type FenceProps = PropsRuntime<'conversation.chat.markdown.fence'> & HocShare<SlotMap['conversation.chat.markdown.fence']>
type SendAction = (sessionId: SessionId, action: string, payload: Record<string, unknown>) => void
interface Seat {
  sessionId: string
  key: string | undefined
  order: number
  index: number
}

/** The native seat is session scoped; DOM is read only for the stable message anchor. */
export function createNativeFenceLayer(ctx: Context, sendAction: SendAction, availability: FileLinkAvailability) {
  return function GenuiFenceLayer({ lang, code, streaming, sessionId, children }: FenceProps): ReactNode {
    const element = useRef<HTMLDivElement>(null)
    const active = useRef<SessionId | undefined>(undefined)
    const [seat, setSeat] = useState<Seat | null>(null)
    useLayoutEffect(() => { active.current = sessionId; return () => { active.current = undefined } }, [sessionId])
    useLayoutEffect(() => {
      const host = element.current
      const row = host?.closest('[data-chat-flow-kind="assistant-step"]')
      if (!host || !row || !sessionId || host.closest('[data-chat-group-part="reasoning"], [data-tool], [data-genui-sidechat-root], [data-genui-surface]')) {
        setSeat(previous => previous === null ? previous : null)
        return
      }
      const fences = [...row.querySelectorAll<HTMLElement>('[data-genui-fence-seat="dsh-ui"]')]
        .filter(node => node.closest('[data-chat-flow-kind="assistant-step"]') === row && !node.closest('[data-chat-group-part="reasoning"]'))
      const index = fences.indexOf(host) + 1
      const anchor = row.getAttribute('data-chat-anchor-key') ?? row.getAttribute('data-chat-node-key')
      const turnStep = anchor === null ? null : /assistant-step(\d+):(\d+)$/.exec(anchor)
      const next: Seat = { sessionId, index, order: turnStep ? Number(turnStep[1]) * 1000 + Number(turnStep[2]) : 0,
        key: anchor === null || index < 1 ? undefined : `dom:${anchor}:${index}` }
      setSeat(previous => previous !== null && Object.keys(next).every(key => next[key as keyof Seat] === previous[key as keyof Seat]) ? previous : next)
    })
    const current = seat?.sessionId === sessionId ? seat : null
    const context: GenuiFenceContext = { sessionId,
      ...(!streaming && current?.key ? { source: { id: current.key, order: [current.order, 0, current.index] as const } } : {}) }
    let content = children
    if (current !== null) {
      const key = current.key ?? lang
      const rendered = lang === 'svg' ? (streaming ? null : renderSvgFence(code, key))
        : lang === 'dsh-html' ? renderHtmlFence(code, key, !streaming)
          : renderResolvedFenceNode(code, key, context)
      content = rendered ?? <>{lang === 'dsh-ui' && !streaming ? <div className="genui-fence-diagnostic"><FenceDiagnostic raw={code} settled /></div> : null}{children}</>
      content = withFileLinkContext(ctx as unknown as FileLinkCordisContext, availability, sessionId, streaming,
        <GenuiActionContext.Provider value={(action, payload) => {
          if (active.current === sessionId) sendAction(sessionId, action, payload)
        }}>{content}</GenuiActionContext.Provider>)
    }
    return <div ref={element} data-genui-fence-seat={lang} style={{ display: 'contents' }}>{content}</div>
  }
}

/** Register only GenUI-owned languages; ordinary JSON and unlabelled code stay code. */
export function installNativeFenceRenderer(ctx: Context, sendAction: SendAction, availability: FileLinkAvailability): () => void {
  const Layer = createNativeFenceLayer(ctx, sendAction, availability)
  const disposers = ['dsh-ui', 'dsh-html', 'svg'].map(key => ctx.slots.inject('conversation.chat.markdown.fence', () => ctx.slots.register({
    name: 'conversation.chat.markdown.fence', key, id: 'genui/fence',
  }, Layer)))
  return () => { for (const dispose of disposers) dispose() }
}
