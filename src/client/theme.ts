/**
 * Root `theme` and per-node `style` (fork: forever-lwy).
 *
 * Both only ever become CSS custom properties and inline style declarations
 * set through React's style object, never a stylesheet string, so a value
 * cannot open a new rule. Values are still filtered: anything that could
 * fetch (`url(`, `image-set(`), run (`expression`, `javascript:`), or break
 * out of a declaration (`;`, braces, angle brackets, backslash, `@`) is
 * dropped, and every value is length-capped.
 * @module @forever-lwy/dsh-genui/client/theme
 */
import type { CSSProperties } from 'react'

export const THEME_RADII = ['none', 'sm', 'md', 'lg', 'xl'] as const
export const THEME_DENSITIES = ['compact', 'normal', 'relaxed'] as const
export const THEME_FONTS = ['sans', 'serif', 'mono', 'rounded'] as const
export const THEME_SURFACES = ['default', 'flat', 'outline', 'soft', 'glass', 'elevated'] as const
export const THEME_SHADOWS = ['none', 'soft', 'strong'] as const

export interface GenuiTheme {
  accent?: string
  radius?: typeof THEME_RADII[number] | number
  density?: typeof THEME_DENSITIES[number]
  /** A preset name or a font-family list. */
  font?: string
  surface?: typeof THEME_SURFACES[number]
  /** Colour or gradient painted behind the whole block. */
  background?: string
  text?: string
  muted?: string
  border?: string
  /** Default categorical palette for chart / echart nodes without their own. */
  palette?: string[]
  shadow?: typeof THEME_SHADOWS[number]
}

/** Style keys a node may carry, mapped to whether a bare number means px. */
const STYLE_KEYS = {
  background: false,
  backgroundColor: false,
  color: false,
  border: false,
  borderColor: false,
  borderWidth: true,
  borderStyle: false,
  borderRadius: true,
  padding: true,
  margin: true,
  gap: true,
  fontSize: true,
  fontWeight: false,
  fontFamily: false,
  fontStyle: false,
  lineHeight: false,
  letterSpacing: true,
  textAlign: false,
  textTransform: false,
  textShadow: false,
  boxShadow: false,
  opacity: false,
  width: true,
  maxWidth: true,
  minHeight: true,
  backdropFilter: false,
  filter: false,
  transform: false,
} as const satisfies Record<string, boolean>

export type GenuiStyleKey = keyof typeof STYLE_KEYS
export type GenuiNodeStyle = Partial<Record<GenuiStyleKey, string | number>>

const UNSAFE = /url\s*\(|image-set|expression|javascript:|[;{}<>\\@]|\/\*/iu
const MAX_VALUE = 240

/** A CSS value the model may set, or undefined when it is unsafe or malformed. */
export function safeCssValue(value: unknown, pxNumbers = false): string | undefined {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined
    return pxNumbers ? `${value}px` : String(value)
  }
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (trimmed === '' || trimmed.length > MAX_VALUE || UNSAFE.test(trimmed)) return undefined
  // Balanced parentheses only: a stray `)` could not escape a declaration set
  // through the CSSOM, but an unbalanced value is a typo, not a style.
  let depth = 0
  for (const ch of trimmed) {
    if (ch === '(') depth++
    else if (ch === ')' && --depth < 0) return undefined
  }
  return depth === 0 ? trimmed : undefined
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const oneOf = <T extends string>(value: unknown, list: readonly T[]): T | undefined =>
  typeof value === 'string' && (list as readonly string[]).includes(value) ? value as T : undefined

/** Repair a node's `style`; unknown keys and unsafe values are dropped. */
export function repairNodeStyle(value: unknown): GenuiNodeStyle | undefined {
  if (!isRecord(value)) return undefined
  const out: GenuiNodeStyle = {}
  for (const [key, raw] of Object.entries(value)) {
    if (!Object.hasOwn(STYLE_KEYS, key)) continue
    const safe = safeCssValue(raw, STYLE_KEYS[key as GenuiStyleKey])
    if (safe !== undefined) out[key as GenuiStyleKey] = typeof raw === 'number' && !STYLE_KEYS[key as GenuiStyleKey] ? raw : safe
  }
  return Object.keys(out).length === 0 ? undefined : out
}

/** Repair a root `theme`; malformed fields are dropped one by one. */
export function repairTheme(value: unknown): GenuiTheme | undefined {
  if (!isRecord(value)) return undefined
  const out: GenuiTheme = {}
  for (const key of ['accent', 'background', 'text', 'muted', 'border'] as const) {
    const safe = safeCssValue(value[key])
    if (safe !== undefined) out[key] = safe
  }
  const radius = typeof value.radius === 'number' && Number.isFinite(value.radius)
    ? Math.max(0, Math.min(40, value.radius))
    : oneOf(value.radius, THEME_RADII)
  if (radius !== undefined) out.radius = radius
  const density = oneOf(value.density, THEME_DENSITIES)
  if (density !== undefined) out.density = density
  const surface = oneOf(value.surface, THEME_SURFACES)
  if (surface !== undefined) out.surface = surface
  const shadow = oneOf(value.shadow, THEME_SHADOWS)
  if (shadow !== undefined) out.shadow = shadow
  const font = safeCssValue(value.font)
  if (font !== undefined && font.length <= 160) out.font = font
  if (Array.isArray(value.palette)) {
    const palette = value.palette.map(entry => safeCssValue(entry)).filter((entry): entry is string => entry !== undefined).slice(0, 16)
    if (palette.length > 0) out.palette = palette
  }
  return Object.keys(out).length === 0 ? undefined : out
}

const FONT_STACKS: Record<typeof THEME_FONTS[number], string> = {
  sans: 'system-ui, -apple-system, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif',
  serif: '"Iowan Old Style", "Palatino Linotype", Georgia, "Songti SC", "Source Han Serif SC", "Noto Serif CJK SC", serif',
  mono: 'var(--dsl-g-font-mono)',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "PingFang SC", system-ui, sans-serif',
}

const RADII: Record<typeof THEME_RADII[number], [number, number, number]> = {
  none: [0, 0, 0],
  sm: [6, 4, 3],
  md: [12, 8, 6],
  lg: [18, 12, 8],
  xl: [26, 16, 10],
}

const GAPS = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const
const DENSITY_SCALE = { compact: 0.67, normal: 1, relaxed: 1.4 } as const

const SHADOWS = {
  none: 'none',
  soft: '0 1px 3px rgba(0, 0, 0, 0.10), 0 8px 24px rgba(0, 0, 0, 0.06)',
  strong: '0 2px 6px rgba(0, 0, 0, 0.14), 0 18px 42px rgba(0, 0, 0, 0.16)',
} as const


/** Relative luminance (0–1) of the first hex or rgb() colour in a CSS value. */
export function cssLuminance(value: string | undefined): number | undefined {
  if (value === undefined) return undefined
  let rgb: [number, number, number] | undefined
  const hex = /#([0-9a-f]{3,8})\b/iu.exec(value)?.[1]
  if (hex !== undefined && (hex.length === 3 || hex.length === 4)) {
    rgb = [0, 1, 2].map(i => parseInt(hex[i]! + hex[i]!, 16)) as [number, number, number]
  } else if (hex !== undefined && (hex.length === 6 || hex.length === 8)) {
    rgb = [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
  } else {
    const match = /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/iu.exec(value)
    if (match !== null) rgb = [Number(match[1]), Number(match[2]), Number(match[3])]
  }
  if (rgb === undefined || rgb.some(channel => !Number.isFinite(channel))) return undefined
  const [r, g, b] = rgb.map(channel => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Tokens of a block that paints its own background, per its own scheme. */
const CANVAS_TOKENS = {
  light: { text: '#1f2328', muted: 'rgba(31, 35, 40, 0.66)', surface: 'rgba(255, 255, 255, 0.78)', border: 'rgba(15, 23, 42, 0.10)' },
  dark: { text: '#f2f3f5', muted: 'rgba(242, 243, 245, 0.68)', surface: 'rgba(255, 255, 255, 0.07)', border: 'rgba(255, 255, 255, 0.14)' },
} as const

type StyleWithVars = CSSProperties & Record<`--${string}`, string>

/**
 * The block root's inline style and `data-genui-surface` for a theme.
 * Custom properties set inline on `.block` win over the class's own token
 * declarations (same element, higher priority), so every component inherits.
 */
export function themeRootProps(theme: GenuiTheme | undefined): { style?: StyleWithVars; surface?: string } {
  if (theme === undefined) return {}
  const style: StyleWithVars = {}
  if (theme.accent !== undefined) {
    style['--dsl-g-accent'] = theme.accent
    style['--dsw-alias-state-business-primary'] = theme.accent
  }
  // A block with its own background no longer sits on the host's surface: its
  // cards, controls and secondary text follow the block's scheme, decided by
  // the text colour (or the background's), so a light poster stays readable
  // in the host's dark theme and vice versa.
  if (theme.background !== undefined) {
    const textLum = cssLuminance(theme.text)
    const backgroundLum = cssLuminance(theme.background)
    const scheme = textLum !== undefined ? (textLum < 0.4 ? 'light' : 'dark')
      : backgroundLum !== undefined ? (backgroundLum < 0.4 ? 'dark' : 'light') : undefined
    if (scheme !== undefined) {
      const tokens = CANVAS_TOKENS[scheme]
      style.colorScheme = scheme
      style['--dsw-alias-label-primary'] = tokens.text
      style['--dsw-alias-label-secondary'] = tokens.muted
      style['--dsw-alias-label-tertiary'] = tokens.muted
      style.color = tokens.text
      style['--dsw-alias-bg-layer-1'] = tokens.surface
      style['--dsw-alias-bg-layer-2'] = tokens.surface
      style['--dsh-genui-surface'] = tokens.surface
      style['--dsl-g-surface'] = tokens.surface
      style['--dsl-g-border'] = tokens.border
      style['--dsl-g-border-surface'] = tokens.border
      style['--dsl-g-hover'] = `color-mix(in srgb, ${tokens.text} 4%, transparent)`
      style['--dsl-g-zebra'] = `color-mix(in srgb, ${tokens.text} 2.5%, transparent)`
    }
  }
  if (theme.text !== undefined) {
    style['--dsw-alias-label-primary'] = theme.text
    style.color = theme.text
  }
  if (theme.muted !== undefined) {
    style['--dsw-alias-label-secondary'] = theme.muted
    style['--dsw-alias-label-tertiary'] = theme.muted
  }
  if (theme.border !== undefined) {
    style['--dsl-g-border'] = theme.border
    style['--dsl-g-border-strong'] = theme.border
    style['--dsl-g-border-surface'] = theme.border
  }
  if (theme.radius !== undefined) {
    const [surface, control, small] = typeof theme.radius === 'number'
      ? [theme.radius, Math.round(theme.radius * 0.66), Math.round(theme.radius * 0.5)]
      : RADII[theme.radius]
    style['--dsl-g-radius-surface'] = `${surface}px`
    style['--dsl-g-radius-control'] = `${control}px`
    style['--dsl-g-radius-sm'] = `${small}px`
  }
  if (theme.density !== undefined && theme.density !== 'normal') {
    const scale = DENSITY_SCALE[theme.density]
    for (const [name, px] of Object.entries(GAPS)) style[`--dsl-g-gap-${name}`] = `${Math.round(px * scale)}px`
  }
  if (theme.font !== undefined) {
    style.fontFamily = (FONT_STACKS as Record<string, string>)[theme.font] ?? theme.font
  }
  if (theme.shadow !== undefined) style['--dsl-g-shadow-card'] = SHADOWS[theme.shadow]
  switch (theme.surface) {
    case 'flat':
      style['--dsl-g-shadow-card'] = 'none'
      style['--dsl-g-border-surface'] = 'transparent'
      break
    case 'outline':
      style['--dsl-g-shadow-card'] = 'none'
      if (theme.border === undefined) style['--dsl-g-border-surface'] = 'color-mix(in srgb, var(--dsw-alias-label-primary) 22%, transparent)'
      style['--dsl-g-surface'] = 'transparent'
      break
    case 'soft':
      style['--dsl-g-shadow-card'] = 'none'
      if (theme.border === undefined) style['--dsl-g-border-surface'] = 'transparent'
      style['--dsl-g-surface'] = 'color-mix(in srgb, var(--dsl-g-accent) 8%, var(--dsh-genui-surface, var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1, #fff))))'
      break
    case 'glass':
      style['--dsl-g-surface'] = 'color-mix(in srgb, var(--dsh-genui-surface, var(--dsw-alias-bg-layer-2, var(--dsw-alias-bg-layer-1, #fff))) 62%, transparent)'
      if (theme.border === undefined) style['--dsl-g-border-surface'] = 'color-mix(in srgb, var(--dsw-alias-label-primary) 16%, transparent)'
      break
    case 'elevated':
      if (theme.shadow === undefined) style['--dsl-g-shadow-card'] = SHADOWS.strong
      break
    default:
      break
  }
  if (theme.background !== undefined) {
    style.background = theme.background
    style.padding = 'var(--dsl-g-gap-xl)'
    style.borderRadius = 'var(--dsl-g-radius-surface)'
  }
  return {
    ...(Object.keys(style).length === 0 ? {} : { style }),
    ...(theme.surface === undefined || theme.surface === 'default' ? {} : { surface: theme.surface }),
  }
}

/** Inline style for a node's `style` field (already repaired). */
export function nodeInlineStyle(style: GenuiNodeStyle | undefined): CSSProperties | undefined {
  if (style === undefined) return undefined
  const out: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || !Object.hasOwn(STYLE_KEYS, key)) continue
    const safe = safeCssValue(value, STYLE_KEYS[key as GenuiStyleKey])
    if (safe !== undefined) out[key] = typeof value === 'number' && !STYLE_KEYS[key as GenuiStyleKey] ? value : safe
  }
  return Object.keys(out).length === 0 ? undefined : out as CSSProperties
}

/** Chart-like node types whose categorical colours come from `palette`. */
const PALETTE_TYPES = new Set(['chart', 'echart'])

/**
 * Give every chart/echart without its own `palette` the theme's palette.
 * Returns the input unchanged when there is nothing to apply; otherwise a
 * copy (the caller's spec is memoized and must stay untouched).
 */
export function applyThemePalette<T extends { theme?: GenuiTheme; items: unknown[] }>(spec: T): T {
  const palette = spec.theme?.palette
  if (palette === undefined || palette.length === 0) return spec
  let changed = false
  const visit = (value: unknown): unknown => {
    if (Array.isArray(value)) {
      let copy: unknown[] | undefined
      value.forEach((entry, index) => {
        const next = visit(entry)
        if (next !== entry) (copy ??= value.slice())[index] = next
      })
      return copy ?? value
    }
    if (!isRecord(value)) return value
    let copy: Record<string, unknown> | undefined
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry !== 'object' || entry === null) continue
      const next = visit(entry)
      if (next !== entry) (copy ??= { ...value })[key] = next
    }
    if (typeof value.type === 'string' && PALETTE_TYPES.has(value.type) && value.palette === undefined) {
      changed = true
      return { ...(copy ?? value), palette }
    }
    return copy ?? value
  }
  const items = visit(spec.items) as unknown[]
  return changed ? { ...spec, items } : spec
}
