/**
 * Fork (forever-lwy): on-demand reference through `genui_docs`.
 *
 * Rules: every component type has its own section; the skill body stays a
 * core of rules (no per-component field dumps); answers carry only the
 * sections asked for, filtered by the settings like the skill.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { COMPONENT_SCHEMAS } from '../src/client/genui-runtime/schema.ts'
import { answerDocs, createGenuiDocsTool, loadDocIndex, parseSections } from '../src/plugin/docs.ts'
import { snapshotGenuiConfig } from '../src/shared/genui-config.ts'

const index = loadDocIndex(process.cwd())
const config = (raw: unknown = {}) => snapshotGenuiConfig(raw)

describe('reference coverage', () => {
  it('has a section for every component type', () => {
    const missing = Object.keys(COMPONENT_SCHEMAS).filter(type => !index.sections.has(type))
    expect(missing).toEqual([])
  })

  it('offers the topics the skill lists', () => {
    for (const topic of ['layouts', 'theme', 'html', 'interaction', 'when', 'computed', 'rich-text', 'local-files', 'icon-names']) {
      expect(index.sections.get(topic)?.kind, topic).toBe('topic')
    }
  })

  it('keeps the skill body to rules, not field dumps', () => {
    const skill = readFileSync('SKILL.md', 'utf8')
    expect(skill.length).toBeLessThan(11_000)
    expect(skill).toContain('genui_docs')
    expect(skill).not.toMatch(/^- table: `\{"type":"table"/mu)
  })

  it('parses aliases and keeps headings', () => {
    const [section] = parseSections('# x\n\n## row / col\n\nbody\n', 'component')
    expect(section).toEqual({ key: 'row / col', kind: 'component', text: '## row / col\n\nbody' })
    expect(index.sections.get('col')).toBe(index.sections.get('row'))
  })
})

describe('answers', () => {
  it('returns only the requested sections, once each', () => {
    const text = answerDocs(index, config(), { items: ['table', 'TABLE', 'chart'] })
    expect(text.startsWith('[genui-docs] table, chart')).toBe(true)
    expect(text).toContain('## table')
    expect(text).toContain('## chart')
    expect(text).not.toContain('## choices')
    expect(text.match(/^## table$/gmu)).toHaveLength(1)
    expect(text.length).toBeLessThan(4000)
  })

  it('accepts a comma-separated string and reports unknown names with the catalog', () => {
    const text = answerDocs(index, config(), { items: 'row, nope' })
    expect(text).toContain('## row / col')
    expect(text).toContain('unknown=nope')
    expect(text).toMatch(/topics: .*layouts/u)
    expect(answerDocs(index, config(), {})).toContain('error=missing_items')
  })

  it('filters by the drawing settings', () => {
    expect(answerDocs(index, config(), { items: ['html'] })).toContain('dsh.action')
    const noScripts = answerDocs(index, config({ html: { scripts: false } }), { items: ['html'] })
    expect(noScripts).toContain('**脚本已禁用**')
    expect(noScripts).not.toContain('dsh.action')
    expect(answerDocs(index, config({ html: { remote: true } }), { items: ['html'] })).toContain('可以加载 https')
    expect(answerDocs(index, config(), { items: ['html'] })).toContain('外部资源已禁用')
    const off = answerDocs(index, config({ html: { enabled: false } }), { items: ['html'] })
    expect(off).toContain('unknown=html')
    expect(off).not.toMatch(/topics: .*\bhtml\b/u)
    for (const raw of [{}, { html: { scripts: false } }]) {
      expect(answerDocs(index, config(raw), { items: ['html', 'theme', 'layouts'] })).not.toMatch(/genui:(if|end)/u)
    }
  })

  it('caps one call', () => {
    const many = Object.keys(COMPONENT_SCHEMAS)
    expect(answerDocs(index, config(), { items: many })).toContain('only the first 16 items')
  })

  it('serves the icon list', () => {
    expect(answerDocs(index, config(), { items: ['icon-names'] })).toContain('CheckCircle')
  })
})

describe('tool', () => {
  it('reads the index lazily and follows live settings', async () => {
    let loads = 0
    let current = config()
    const tool = createGenuiDocsTool(() => current, () => { loads++; return index }) as unknown as { name: string; execute(args: unknown): Promise<string> }
    expect(tool.name).toBe('genui_docs')
    expect(loads).toBe(0)
    expect(await tool.execute({ items: ['html'] })).toContain('dsh.action')
    current = config({ html: { scripts: false } })
    expect(await tool.execute({ items: ['html'] })).not.toContain('dsh.action')
    expect(loads).toBe(1)
  })
})
