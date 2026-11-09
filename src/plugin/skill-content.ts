/**
 * Settings-dependent passages of SKILL.md (fork: forever-lwy).
 *
 * SKILL.md stays one file; passages that only hold under some settings are
 * fenced with HTML comments, which a skill reader never sees rendered:
 *
 *     <!-- genui:if validation=always|uncertain -->
 *     ...text...
 *     <!-- genui:end -->
 *
 * Keys: `validation` (always / uncertain / skip), `html` (on / off),
 * `scripts` (on / off, meaningful only with html on). Blocks may nest; the
 * innermost ones resolve first.
 * @module @forever-lwy/dsh-genui/plugin/skill-content
 */
import type { GenuiConfig } from '../shared/genui-config.ts'

/** An innermost block: its body holds no further `genui:if`. */
const BLOCK = /<!-- genui:if ([a-z]+)=([a-z|]+) -->\n?((?:(?!<!-- genui:if )[\s\S])*?)<!-- genui:end -->\n?/gu

function valueOf(key: string, config: GenuiConfig): string | undefined {
  switch (key) {
    case 'validation': return config.validation
    case 'html': return config.html.enabled ? 'on' : 'off'
    case 'scripts': return config.html.enabled && config.html.scripts ? 'on' : 'off'
    default: return undefined
  }
}

/**
 * Keep the blocks whose condition matches the settings and drop the rest.
 * An unknown key keeps its block (a typo must not silently delete guidance).
 */
export function adaptSkillContent(content: string, config: GenuiConfig): string {
  let current = content
  for (let pass = 0; pass < 8; pass++) {
    const next = current.replace(BLOCK, (_match, key: string, values: string, body: string) => {
      const actual = valueOf(key, config)
      if (actual === undefined) return body
      return values.split('|').includes(actual) ? body : ''
    })
    if (next === current) break
    current = next
  }
  return current
}
