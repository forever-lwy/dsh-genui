/**
 * Fork (forever-lwy): whole-answer export.
 *
 * Rules: only the turn's assistant rows are exported; reasoning, tool rows,
 * hidden source blocks and per-block export chrome are dropped; each GenUI
 * block becomes a runtime slot carrying its artifact (with a static copy as
 * fallback); each dsh-html drawing becomes a frame slot; the page's policy
 * closes the network.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { buildAnswerHtml, collectAnswerRows } from '../src/client/answer-export.ts'
import { registerExportableBlock } from '../src/client/artifact/registry.ts'
import { createGenuiArtifact } from '../src/client/artifact/create.ts'
import { repairGenuiSpec } from '../src/client/guard.ts'
import { renderHtmlFence } from '../src/client/html-fence.tsx'

function decode(base64: string): unknown {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))))
}

function el(tag: string, attrs: Record<string, string> = {}, ...children: Array<Node | string>): HTMLElement {
  const node = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  node.append(...children)
  return node
}

let flow: HTMLElement
let anchor: HTMLElement
let artifactEl: HTMLElement
let htmlHost: HTMLElement

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(new Uint8Array([1, 2, 3]), { status: 200 })))
  artifactEl = el('div', { 'data-genui-artifact': 'true' }, el('div', { 'data-genui': '' }, 'GenUI 静态内容'), el('div', { 'data-genui-export': '' }, '导出'))
  htmlHost = el('div')
  anchor = el('button', { 'data-genui-answer-export': '' })
  flow = el('div', { class: 'flow' },
    el('div', { 'data-chat-flow-kind': 'user', 'data-chat-turn': '1' }, '问题'),
    el('div', { 'data-chat-flow-kind': 'turn-process', 'data-chat-turn': '1' }, '工具调用'),
    el('div', { 'data-chat-flow-kind': 'assistant-step', 'data-chat-turn': '1' },
      el('div', { 'data-chat-group-part': 'reasoning' }, '思考过程'),
      el('p', {}, '正文第一段'),
      el('div', { class: 'md-code-block', 'data-genui-rendered': '' }, '{"items":[]}'),
      el('div', { class: 'genui-dom-fence' }, artifactEl),
      htmlHost,
      el('p', {}, '正文最后一段')),
    el('div', { 'data-chat-flow-kind': 'turn-tail', 'data-chat-turn': '1' }, anchor),
    el('div', { 'data-chat-flow-kind': 'user', 'data-chat-turn': '2' }, '下一问'),
    el('div', { 'data-chat-flow-kind': 'assistant-step', 'data-chat-turn': '2' }, '下一答'))
  document.body.append(flow)
  render(<>{renderHtmlFence('<p class="drawn">画面</p>', 'k', true)}</>, { container: htmlHost })
})

afterEach(() => {
  cleanup()
  flow.remove()
  vi.unstubAllGlobals()
})

describe('answer export', () => {
  it('collects only this turn’s assistant rows', () => {
    const rows = collectAnswerRows(anchor)
    expect(rows).toHaveLength(1)
    expect(rows[0]!.textContent).toContain('正文第一段')
  })

  it('falls back to walking back to the turn start without turn markers', () => {
    for (const row of flow.children) row.removeAttribute('data-chat-turn')
    const rows = collectAnswerRows(anchor)
    expect(rows.map(row => row.textContent?.slice(0, 2))).toEqual(['思考'])
  })

  // Runs before the success case: the runtime bytes are cached once fetched.
  it('keeps the static copy when the runtime cannot be fetched', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    const spec = repairGenuiSpec({ items: [{ type: 'text', content: 'x' }] })!
    registerExportableBlock(artifactEl, () => createGenuiArtifact(spec))
    const html = await buildAnswerHtml(anchor)
    expect(html).toContain('GenUI 静态内容')
    expect(html).not.toContain('genui-export-artifacts')
  })

  it('builds a page with runtime and frame slots and none of the chrome', async () => {
    const spec = repairGenuiSpec({ theme: { accent: '#e11d48' }, items: [{ type: 'stat', label: '访问', value: '12' }] })!
    registerExportableBlock(artifactEl, () => createGenuiArtifact(spec))
    const html = await buildAnswerHtml(anchor, { title: '测试' })
    expect(html).toContain('<title>测试</title>')
    expect(html).toContain('正文第一段')
    expect(html).toContain('正文最后一段')
    for (const dropped of ['思考过程', '工具调用', '{"items":[]}', '下一答', '>导出<']) expect(html).not.toContain(dropped)
    expect(html).toContain('data-genui-export-block="0"')
    expect(html).toContain('GenUI 静态内容')
    const artifacts = decode(/id="genui-export-artifacts">([^<]+)</u.exec(html)![1]!) as Array<{ spec: { theme?: unknown } }>
    expect(artifacts).toHaveLength(1)
    expect(artifacts[0]!.spec.theme).toEqual({ accent: '#e11d48' })
    expect(html).toContain('data-genui-bundle="runtime"')
    expect(html).toContain('data-genui-export-frame="0"')
    const frames = decode(/id="genui-export-frames">([^<]+)</u.exec(html)![1]!) as Array<{ srcdoc: string }>
    expect(frames[0]!.srcdoc).toContain('<p class="drawn">画面</p>')
    expect(frames[0]!.srcdoc).toContain('connect-src &#39;none&#39;')
    expect(html).toMatch(/Content-Security-Policy" content="default-src &#39;none&#39;; script-src &#39;unsafe-inline&#39; blob: &#39;unsafe-eval&#39;/u)
    expect(html).toContain('connect-src &#39;none&#39;')
  })

  it('refuses an empty answer', async () => {
    const lone = el('div', { 'data-chat-flow-kind': 'turn-tail' }, el('span'))
    document.body.append(lone)
    await expect(buildAnswerHtml(lone.firstElementChild!)).rejects.toThrow('empty')
    lone.remove()
  })
})
