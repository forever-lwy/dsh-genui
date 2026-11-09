/**
 * Fork (forever-lwy): root `theme` and per-node `style`.
 *
 * Rules: both survive repair only in sanitized form (unknown keys and values
 * that could fetch or break a declaration are dropped); the theme lands as
 * custom properties on the block root, so every component inherits; the
 * theme palette reaches charts that have none; a block with its own
 * background picks its own light/dark tokens.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { GenuiBlock } from '../src/client/GenuiBlock.tsx'
import { processGenuiSpec, repairGenuiSpec } from '../src/client/guard.ts'
import { applyThemePalette, cssLuminance, nodeInlineStyle, repairNodeStyle, repairTheme, safeCssValue, themeRootProps } from '../src/client/theme.ts'
import { diagnoseUnknownGenuiFields } from '../src/client/genui-runtime/diagnostics.ts'

afterEach(cleanup)

describe('safe CSS values', () => {
  it('keeps colours, gradients and lengths', () => {
    expect(safeCssValue('#e11d48')).toBe('#e11d48')
    expect(safeCssValue('linear-gradient(135deg, #fff1f2, rgb(255 228 230))')).toBe('linear-gradient(135deg, #fff1f2, rgb(255 228 230))')
    expect(safeCssValue(12, true)).toBe('12px')
    expect(safeCssValue(600)).toBe('600')
  })

  it('drops anything that fetches, runs or escapes a declaration', () => {
    for (const bad of [
      'url(https://x.test/a.png)', 'URL( "x" )', 'image-set("a.png" 1x)', 'expression(alert(1))', 'javascript:alert(1)',
      'red; background: blue', 'red}body{color:red', '</style>', 'red \\3b', '@import x', 'red /* x */', 'calc(1px', '1px)',
      '', '   ', 'x'.repeat(241),
    ]) expect(safeCssValue(bad), bad).toBeUndefined()
    expect(safeCssValue(Number.NaN)).toBeUndefined()
    expect(safeCssValue({})).toBeUndefined()
  })
})

describe('repair', () => {
  it('keeps a sanitized theme and node style through the guard', () => {
    const processed = processGenuiSpec({
      theme: { accent: '#7c3aed', radius: 'lg', density: 'compact', font: 'serif', surface: 'glass', shadow: 'strong', palette: ['#111', 'url(x)', '#222'], bogus: 1, background: 'url(evil)' },
      items: [{ type: 'text', content: 'hi', style: { background: '#fff', padding: 12, fontWeight: 700, color: 'red;x', position: 'fixed' } }],
    })
    expect(processed.errors).toEqual([])
    expect(processed.spec?.theme).toEqual({ accent: '#7c3aed', radius: 'lg', density: 'compact', font: 'serif', surface: 'glass', shadow: 'strong', palette: ['#111', '#222'] })
    expect(processed.spec?.items[0]).toMatchObject({ style: { background: '#fff', padding: '12px', fontWeight: 700 } })
    expect((processed.spec?.items[0] as { style: Record<string, unknown> }).style).not.toHaveProperty('position')
    expect((processed.spec?.items[0] as { style: Record<string, unknown> }).style).not.toHaveProperty('color')
  })

  it('reports no unknown-field diagnostics for theme and style', () => {
    expect(diagnoseUnknownGenuiFields({ theme: { accent: '#000' }, items: [{ type: 'stat', label: 'a', value: '1', style: { color: '#000' } }] })).toEqual([])
  })

  it('drops an empty or malformed theme / style instead of the block', () => {
    const spec = repairGenuiSpec({ theme: 'dark', items: [{ type: 'text', content: 'x', style: 'color:red' }] })
    expect(spec?.theme).toBeUndefined()
    expect(spec?.items[0]).not.toHaveProperty('style')
    expect(repairTheme({ radius: 'huge', density: 'tight' })).toBeUndefined()
    expect(repairNodeStyle({ zIndex: 9 })).toBeUndefined()
  })

  it('clamps a numeric radius', () => {
    expect(repairTheme({ radius: 999 })?.radius).toBe(40)
    expect(repairTheme({ radius: -3 })?.radius).toBe(0)
  })
})

describe('theme tokens', () => {
  it('maps theme fields onto the block tokens', () => {
    const { style, surface } = themeRootProps({ accent: '#e11d48', radius: 'xl', density: 'relaxed', font: 'mono', shadow: 'none', surface: 'outline', border: '#ccc' })
    expect(style).toMatchObject({
      '--dsl-g-accent': '#e11d48',
      '--dsw-alias-state-business-primary': '#e11d48',
      '--dsl-g-radius-surface': '26px',
      '--dsl-g-gap-lg': '22px',
      fontFamily: 'var(--dsl-g-font-mono)',
      '--dsl-g-shadow-card': 'none',
      '--dsl-g-border-surface': '#ccc',
      '--dsl-g-surface': 'transparent',
    })
    expect(surface).toBe('outline')
    expect(themeRootProps(undefined)).toEqual({})
    expect(themeRootProps({ surface: 'default' })).toEqual({})
  })

  it('gives a block with its own background its own scheme', () => {
    const light = themeRootProps({ background: 'linear-gradient(135deg,#fff1f2,#ffe4e6)' }).style!
    expect(light.colorScheme).toBe('light')
    expect(light['--dsl-g-surface']).toContain('255, 255, 255, 0.78')
    expect(light['--dsw-alias-label-primary']).toBe('#1f2328')
    const dark = themeRootProps({ background: '#0b1020' }).style!
    expect(dark.colorScheme).toBe('dark')
    expect(dark['--dsw-alias-label-primary']).toBe('#f2f3f5')
    // Explicit text wins and decides the scheme.
    const explicit = themeRootProps({ background: 'var(--x)', text: '#3f0d1a' }).style!
    expect(explicit.colorScheme).toBe('light')
    expect(explicit['--dsw-alias-label-primary']).toBe('#3f0d1a')
    expect(light.padding).toBe('var(--dsl-g-gap-xl)')
  })

  it('reads luminance from hex and rgb', () => {
    expect(cssLuminance('#fff')).toBeCloseTo(1)
    expect(cssLuminance('rgb(0, 0, 0)')).toBe(0)
    expect(cssLuminance('hsl(0 0% 50%)')).toBeUndefined()
  })

  it('renders the theme on the block root and the node style on the node', () => {
    const spec = repairGenuiSpec({
      theme: { accent: '#e11d48', surface: 'glass' },
      items: [{ type: 'text', content: '标题', style: { color: '#123456', letterSpacing: 2 } }],
    })!
    const { container } = render(<GenuiBlock spec={spec} animateEntrance={false} />)
    const block = container.querySelector('[data-genui]') as HTMLElement
    expect(block.style.getPropertyValue('--dsl-g-accent')).toBe('#e11d48')
    expect(block.getAttribute('data-genui-surface')).toBe('glass')
    const text = [...container.querySelectorAll('div')].find(element => element.textContent === '标题' && element.style.color !== '')!
    expect(text.style.color).toBe('rgb(18, 52, 86)')
    expect(text.style.letterSpacing).toBe('2px')
  })

  it('wraps component nodes whose element is not a host element', () => {
    expect(nodeInlineStyle({ opacity: 0.5, width: 100 })).toEqual({ opacity: 0.5, width: '100px' })
    expect(nodeInlineStyle(undefined)).toBeUndefined()
  })
})

describe('theme palette', () => {
  it('fills charts without a palette and leaves the rest untouched', () => {
    const spec = {
      theme: { palette: ['#111', '#222'] },
      items: [
        { type: 'chart', kind: 'bars', data: [{ label: 'a', value: 1 }] },
        { type: 'card', items: [{ type: 'echart', preset: 'bar', palette: ['#999'] }, { type: 'chart', kind: 'line', data: [] }] },
      ],
    }
    const painted = applyThemePalette(spec)
    expect(painted).not.toBe(spec)
    expect((painted.items[0] as { palette?: string[] }).palette).toEqual(['#111', '#222'])
    const card = painted.items[1] as { items: Array<{ palette?: string[] }> }
    expect(card.items[0]!.palette).toEqual(['#999'])
    expect(card.items[1]!.palette).toEqual(['#111', '#222'])
    // The input is not mutated.
    expect((spec.items[0] as { palette?: string[] }).palette).toBeUndefined()
    const plain = { items: [{ type: 'text' }] }
    expect(applyThemePalette(plain)).toBe(plain)
  })
})
