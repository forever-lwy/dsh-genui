/**
 * Fork (forever-lwy): ```dsh-html drawings.
 *
 * Rules: the frame is sandboxed without allow-same-origin; the CSP is written
 * before the model's markup, closes the network, and blocks the model's
 * scripts (but not the bootstrap) when scripts are off; while streaming a
 * one-line placeholder stands in; once settled the frame is built; turning
 * drawings off shows the source; actions need focus inside the frame.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render } from '@testing-library/react'
import { buildHtmlFrameDocument, FRAME_MESSAGE_TAG, FRAME_SANDBOX, frameCsp } from '../src/client/html-frame.ts'
import { renderHtmlFence, htmlFrameRecordOf } from '../src/client/html-fence.tsx'
import { setClientConfig } from '../src/client/client-config.ts'
import { GenuiActionContext } from '../src/client/action-context.ts'

afterEach(() => {
  cleanup()
  setClientConfig({})
})

const theme = { vars: { '--dsh-fg': 'rgb(1, 2, 3)', '--dsh-accent': '#4f8ef7', '--bad name': 'x', '--dsh-bg': 'red;}' }, scheme: 'light' as const }

describe('frame document', () => {
  it('opens with our doctype, CSP and bootstrap before the model markup', () => {
    const html = buildHtmlFrameDocument('<!DOCTYPE html><html><body><h1>hi</h1></body></html>', { frameId: 'f1', scripts: true, remote: false, theme })
    expect(html.startsWith('<!doctype html>')).toBe(true)
    expect(html.match(/<!doctype/giu)).toHaveLength(1)
    const csp = html.indexOf('Content-Security-Policy')
    const bootstrap = html.indexOf('<script nonce=')
    const model = html.indexOf('<h1>hi</h1>')
    expect(csp).toBeGreaterThan(0)
    expect(csp).toBeLessThan(bootstrap)
    expect(bootstrap).toBeLessThan(model)
    expect(html).toContain('--dsh-fg:rgb(1, 2, 3);')
    expect(html).not.toContain('--bad name')
    expect(html).not.toContain('red;}')
    expect(html).toContain('<base target="_blank">')
  })

  it('closes the network and only opens https when remote is on', () => {
    const closed = frameCsp({ scripts: true, remote: false }, 'n')
    expect(closed).toContain("connect-src 'none'")
    expect(closed).toContain("form-action 'none'")
    expect(closed).toContain("frame-src 'none'")
    expect(closed).not.toContain('https:')
    expect(closed).toContain("script-src 'unsafe-inline'")
    const open = frameCsp({ scripts: true, remote: true }, 'n')
    expect(open).toContain("img-src data: blob: https:")
    expect(open).toContain("connect-src 'none'")
  })

  it('blocks the model scripts with a nonce-only policy when scripts are off', () => {
    const csp = frameCsp({ scripts: false, remote: false }, 'abc')
    expect(csp).toContain("script-src 'nonce-abc'")
    expect(csp).not.toContain('unsafe-inline\' \'unsafe-eval')
    const html = buildHtmlFrameDocument('<script>alert(1)</script>', { frameId: 'f', scripts: false, remote: false, theme })
    // The policy sits in an attribute, so its quotes are escaped.
    const nonce = /&#39;nonce-([0-9a-f]+)&#39;/u.exec(html)![1]
    expect(html).toContain(`<script nonce="${nonce}">`)
  })

  it('never grants same-origin', () => {
    expect(FRAME_SANDBOX).toContain('allow-scripts')
    expect(FRAME_SANDBOX).not.toContain('allow-same-origin')
    expect(FRAME_SANDBOX).not.toContain('allow-top-navigation')
  })
})

describe('fence component', () => {
  it('shows a placeholder while streaming and builds the frame once settled', () => {
    const { container, rerender } = render(<>{renderHtmlFence('<div>1</div>\n<div>2', 'k', false)}</>)
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.querySelector('[role="status"]')?.textContent).toContain('2')
    rerender(<>{renderHtmlFence('<div>1</div>\n<div>2</div>', 'k', true)}</>)
    const frame = container.querySelector('iframe')!
    expect(frame.getAttribute('sandbox')).toBe(FRAME_SANDBOX)
    expect(frame.getAttribute('srcdoc')).toContain('<div>2</div>')
    expect(htmlFrameRecordOf(container.querySelector('[data-genui-html]')!)).toMatchObject({ raw: '<div>1</div>\n<div>2</div>', scripts: true, remote: false })
  })

  it('shows the source when drawings are turned off', () => {
    setClientConfig({ html: { enabled: false } })
    const { container } = render(<>{renderHtmlFence('<b>x</b>', 'k', true)}</>)
    expect(container.querySelector('iframe')).toBeNull()
    expect(container.textContent).toContain('自定义画面已在设置中关闭')
  })

  it('applies the configured script setting to the frame policy', () => {
    setClientConfig({ html: { scripts: false } })
    const { container } = render(<>{renderHtmlFence('<b>x</b>', 'k', true)}</>)
    expect(container.querySelector('iframe')!.getAttribute('srcdoc')).toMatch(/script-src &#39;nonce-/u)
  })

  it('sizes the frame from its reports and relays actions only with focus inside', () => {
    const onAction = vi.fn()
    const { container } = render(
      <GenuiActionContext.Provider value={onAction}>{renderHtmlFence('<b>x</b>', 'k', true)}</GenuiActionContext.Provider>,
    )
    const frame = container.querySelector('iframe')!
    const id = /var ID="([0-9a-f]+)"/u.exec(frame.getAttribute('srcdoc')!)![1]
    const post = (data: Record<string, unknown>) => act(() => {
      window.dispatchEvent(new MessageEvent('message', { data: { [FRAME_MESSAGE_TAG]: id, ...data }, source: frame.contentWindow }))
    })
    post({ type: 'size', height: 333 })
    expect(frame.style.height).toBe('333px')
    post({ type: 'size', height: 99999 })
    expect(frame.style.height).toBe('2400px')
    // Focus elsewhere: ignored.
    post({ type: 'action', name: 'pick', data: { plan: 'B' } })
    expect(onAction).not.toHaveBeenCalled()
    // Foreign source or wrong id: ignored.
    act(() => { window.dispatchEvent(new MessageEvent('message', { data: { [FRAME_MESSAGE_TAG]: 'other', type: 'size', height: 10 }, source: frame.contentWindow })) })
    expect(frame.style.height).toBe('2400px')
    // Focus inside the frame: relayed once, then rate-limited.
    vi.spyOn(document, 'activeElement', 'get').mockReturnValue(frame)
    post({ type: 'action', name: 'pick', data: { plan: 'B' } })
    post({ type: 'action', name: 'pick', data: { plan: 'C' } })
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('pick', { plan: 'B' })
    post({ type: 'error', message: 'boom' })
    expect(container.textContent).toContain('画面脚本出错：boom')
  })
})
