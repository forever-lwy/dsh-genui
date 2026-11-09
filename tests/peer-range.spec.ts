/**
 * Fork (forever-lwy) version policy: own plugins are never gated by DSH
 * version. `engines.dsh` is `*`, and every `@deepseek-ai/dsh-*` peer carries
 * the same open lower bound (no upper bound, no exact pin). Compatibility is
 * established by building and testing after each DSH upgrade instead.
 * DSH compares prerelease hosts with includePrerelease, as tested here.
 */
import { readFile } from 'node:fs/promises'
import { satisfies } from 'semver'
import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(await readFile('package.json', 'utf8')) as {
  peerDependencies: Record<string, string>
  engines: { dsh: string }
}
const dshPeers = Object.entries(pkg.peerDependencies).filter(([name]) => name.startsWith('@deepseek-ai/dsh-'))
const floor = '>=0.2.1-rc.5'
const versionCases = [
  ['0.2.0', false],
  ['0.2.1-rc.4', false],
  ['0.2.1-rc.5', true],
  ['0.2.1', true],
  ['0.2.2-alpha.2', true],
  ['0.2.2-rc.1', true],
  ['0.2.2', true],
  ['0.3.0-rc.1', true],
  ['1.0.0', true],
] as const

describe('DSH peer version ranges (fork policy)', () => {
  it('covers all 18 DSH packages', () => {
    expect(dshPeers).toHaveLength(18)
  })

  it.each(versionCases)('%s support matches every DSH peer range', (version, expected) => {
    const mismatches = dshPeers
      .filter(([, range]) => satisfies(version, range, { includePrerelease: true }) !== expected)
      .map(([name]) => name)
    expect(mismatches).toEqual([])
  })

  it('uses one open floor for every peer and no engines gate', () => {
    expect(pkg.engines.dsh).toBe('*')
    expect(dshPeers.every(([, range]) => range === floor)).toBe(true)
  })
})
