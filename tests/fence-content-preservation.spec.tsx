// #418: renderable JSON must not authorize hiding the rest of the reply.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import type { Context } from '@deepseek-ai/cordis'
import { createNativeFenceLayer } from '../src/client/native-fence.tsx'
import { extractDshUiFences, fenceFailures, planFenceFeedback } from '../src/plugin/fence-feedback.ts'
import { resolveFence } from '../src/shared/fence-resolve.ts'
import { completeFenceJson } from '../src/shared/fence-repair.ts'
import { createValidateDshUiTool } from '../src/plugin/tool.ts'
import { renderResolvedFenceNode } from '../src/client/fence-render.tsx'

const spec = '{"items":[{"type":"callout","content":"闭包保留外部变量的访问能力"}]}'
const explanation = '这里还需要解释：函数返回后，内部函数依然通过词法环境访问 count。';
afterEach(() => { cleanup(); document.body.innerHTML = ''; vi.restoreAllMocks() })

it.each(['closed', 'missing-close', 'late-close'] as const)('tracks prose at the fence boundary: %s', async kind => {
  const markdown = kind === 'closed' ? '```dsh-ui\n' + spec + '\n```\n' + explanation
    : '```dsh-ui\n' + spec + '\n' + explanation + (kind === 'late-close' ? '\n```' : '');
  const fences = extractDshUiFences(markdown);
  const ctx = { get: () => undefined } as unknown as Context
  const Layer = createNativeFenceLayer(ctx, () => {}, { subscribe: () => () => {}, getSnapshot: () => false })
  const tree = (raw = fences[0]!.raw, streaming = false, prose = kind === 'closed') => <div data-chat-flow-kind="assistant-step" data-chat-anchor-key="sample:assistant-step1:1">
    <Layer code={raw} lang="dsh-ui" streaming={streaming} sessionId={'s' as never}><pre data-native-fallback>{raw}</pre></Layer>
    {prose ? <p>{explanation}</p> : null}
  </div>
  const view = render(tree(fences[0]!.raw, kind === 'missing-close'))
  const row = view.container
  try {
    if (kind === 'missing-close') {
      await waitFor(() => expect(row.querySelector('[data-genui]')).not.toBeNull())
      view.rerender(tree())
    }
    if (kind === 'closed') {
      await waitFor(() => expect(row.querySelector('[data-genui]')?.textContent).toContain('闭包保留'))
      expect(row.querySelector('[data-native-fallback]')).toBeNull()
      expect(fenceFailures(markdown)).toEqual([])
    } else {
      await waitFor(() => expect(row.querySelector('[role=alert]')).not.toBeNull())
      expect(row.querySelector('[data-native-fallback]')).not.toBeNull()
      expect(row.querySelector('[data-genui]')).toBeNull()
      expect(fenceFailures(markdown)[0]?.detail).toContain('error=unconsumed_content')
      const plan = planFenceFeedback({text: markdown, turn: 1, correctedSpec: new Set(), validatedThisTurn: true, deliveredThisTurn: true, aborted: false})
      expect(plan?.text).toContain('next=resend_corrected_fence_and_preserved_text')
    }
    expect(row.textContent).toContain(explanation)
    if (kind !== 'closed') {
      expect(row.querySelector('[data-genui-export]')).toBeNull()
      view.rerender(tree(spec, false, true))
      await waitFor(() => expect(row.querySelector('[data-native-fallback]')).toBeNull())
      expect(row.querySelector('p')?.textContent).toBe(explanation)
      expect(row.querySelector('[role=alert]')).toBeNull()
    }
  } finally { view.unmount() }
});

it.each([
  spec,
  '[{"type":"text","content":"quoted } ] and \\\"word\\\""}]',
  '{"items":[{"type":"text","content":"say "hello" now"}]}',
  '{"items":[{"type":"text",["content"]:"text"}]}',
])('refuses a lossy validator replacement: %s', async root => {
  const raw = `${root}\n${explanation}\n<script>window.tailExecuted=true</script>`
  expect(completeFenceJson(raw)?.unconsumedText).toContain(explanation)
  const resolution = resolveFence(raw, { settled: true })
  expect(resolution.spec).toBeNull()
  expect(resolution.unconsumedText).toContain(explanation)
  const result = String(await createValidateDshUiTool().execute({ spec: raw }))
  expect(result).toContain('error=unconsumed_content')
  expect(result).toContain('preserve_unconsumed_content=true')
  expect(result).not.toContain('repaired_json:')
  expect(result).not.toContain('next=emit_repaired_fence')
})

it('does not publish or export a panel whose tail would be hidden', () => {
  const raw = spec.replace('{"items"', '{"panel":true,"items"') + explanation
  expect(renderResolvedFenceNode(raw, 'panel', {
    sessionId: 's', source: { id: 'sample', order: [1, 0, 0] },
  })).toBeNull()
})

it('keeps normal unclosed JSON, whitespace, and full-body syntax repair renderable', () => {
  for (const raw of [spec, `${spec}\n  `, spec.replace('}]}', '},]}')]) {
    expect(resolveFence(raw, { settled: true }).spec).not.toBeNull()
    expect(fenceFailures(`\`\`\`dsh-ui\n${raw}`)).toEqual([])
  }
})
