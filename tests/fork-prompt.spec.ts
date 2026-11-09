/**
 * Fork (forever-lwy): Markdown-first prompt, validation modes, volatile
 * settings, and the settings-dependent SKILL.md passages.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import * as GenUI from '../src/plugin/index.ts'
import { buildGenuiSectionText } from '../src/plugin/prompt.ts'
import { adaptSkillContent } from '../src/plugin/skill-content.ts'
import { DEFAULT_GENUI_CONFIG, snapshotGenuiConfig } from '../src/shared/genui-config.ts'
import { settingsDiff } from '../src/client/settings.tsx'

const config = (raw: unknown) => snapshotGenuiConfig(raw)

describe('section text', () => {
  it('puts Markdown first and names long prose answers explicitly', () => {
    const text = buildGenuiSectionText()
    expect(text).toContain('**默认写 Markdown，不写 dsh-ui。**')
    for (const kind of ['会议纪要', '总结', '报告', '教程']) expect(text).toContain(kind)
    expect(text.indexOf('默认写 Markdown')).toBeLessThan(text.indexOf('删掉这个组件，读者会不会更费劲'))
  })

  it('follows the validation mode', () => {
    const always = buildGenuiSectionText(config({}))
    expect(always).toContain('≥3 节点或含 table 时调 validate_dsh_ui')
    const uncertain = buildGenuiSectionText(config({ validation: 'uncertain' }))
    expect(uncertain).toContain('只在字段名、结构或资源上限拿不准时调 validate_dsh_ui')
    expect(uncertain).not.toContain('≥3 节点或含 table')
    const skip = buildGenuiSectionText(config({ validation: 'skip' }))
    expect(skip).not.toContain('validate_dsh_ui')
    expect(skip).toContain('不调用校验工具')
  })

  it('teaches dsh-html only when enabled, and says what the sandbox allows', () => {
    expect(buildGenuiSectionText(config({}))).toContain('```dsh-html')
    expect(buildGenuiSectionText(config({ html: { enabled: false } }))).not.toContain('dsh-html')
    expect(buildGenuiSectionText(config({ html: { scripts: false } }))).toContain('脚本已禁用')
    expect(buildGenuiSectionText(config({ html: { remote: true } }))).toContain('可加载 https')
    expect(buildGenuiSectionText(config({}))).toContain('dsh.action(name, data)')
    expect(buildGenuiSectionText(config({ html: { scripts: false } }))).not.toContain('dsh.action')
  })

  it('mentions render_ui only when that tool is on (off by default)', () => {
    expect(DEFAULT_GENUI_CONFIG.renderUiTool).toBe(false)
    expect(buildGenuiSectionText(config({}))).not.toContain('render_ui')
    expect(buildGenuiSectionText(config({ renderUiTool: true }))).toContain('Tool channel: render_ui')
  })

  it('stays within the fork budget', () => {
    // Upstream's section is ≤3400 chars; the fork adds Markdown-first, theme
    // and dsh-html guidance while dropping render_ui (≈1.7k chars of tool) by default.
    expect(buildGenuiSectionText(config({})).length).toBeLessThanOrEqual(4200)
    expect(buildGenuiSectionText(config({ validation: 'skip', html: { enabled: false } })).length).toBeLessThanOrEqual(3700)
  })
})

describe('settings snapshot', () => {
  it('reads volatile references and plain values, defaulting the rest', () => {
    const ref = <T>(value: T) => ({ get: () => value })
    expect(config({ validation: ref('skip'), html: ref({ scripts: false, maxHeight: 50 }) })).toEqual({
      ...DEFAULT_GENUI_CONFIG,
      validation: 'skip',
      html: { ...DEFAULT_GENUI_CONFIG.html, scripts: false, maxHeight: 200 },
    })
    expect(config({ validation: 'nope', fenceFeedback: 'yes' })).toEqual(DEFAULT_GENUI_CONFIG)
    expect(config(undefined)).toEqual(DEFAULT_GENUI_CONFIG)
  })

  it('writes whole sections and unsets defaults', () => {
    const next = { ...DEFAULT_GENUI_CONFIG, validation: 'skip' as const, html: { ...DEFAULT_GENUI_CONFIG.html, scripts: false } }
    expect(settingsDiff(DEFAULT_GENUI_CONFIG, next)).toEqual([
      { op: 'set', path: ['validation'], value: 'skip' },
      { op: 'set', path: ['html'], value: next.html },
    ])
    expect(settingsDiff(next, DEFAULT_GENUI_CONFIG)).toEqual([
      { op: 'unset', path: ['validation'] },
      { op: 'unset', path: ['html'] },
    ])
  })
})

describe('plugin wiring', () => {
  async function boot(input: unknown, plugin: unknown = GenUI) {
    const ctx = new Context()
    await ctx.plugin(SystemPrompt)
    const registered = new Map<string, number>()
    ctx.provide('tools', {
      register(definition: { name: string }) {
        registered.set(definition.name, (registered.get(definition.name) ?? 0) + 1)
        return () => { registered.set(definition.name, (registered.get(definition.name) ?? 1) - 1) }
      },
    } as never)
    const fork = await ctx.plugin(plugin as never, input as never)
    return { ctx, fork, registered }
  }

  it('registers validate_dsh_ui unless validation is skipped, and render_ui only when asked', async () => {
    const { registered, fork } = await boot({})
    expect(registered.get('validate_dsh_ui')).toBe(1)
    expect(registered.get('render_ui') ?? 0).toBe(0)
    await fork.dispose()
    const skipped = await boot({ validation: 'skip', renderUiTool: true })
    expect(skipped.registered.get('validate_dsh_ui') ?? 0).toBe(0)
    expect(skipped.registered.get('render_ui')).toBe(1)
    await skipped.fork.dispose()
  })

  it('applies a volatile update to the prompt and the tool set without a remount', async () => {
    // DSH's loader hands volatile fields as references and skips schema
    // validation for them; calling apply directly reproduces that.
    let validation = 'always'
    const input = { validation: { get: () => validation } }
    const { ctx, registered, fork } = await boot(undefined, { name: 'genui-volatile', inject: GenUI.inject, apply: (scope: Context) => GenUI.apply(scope, input) })
    expect(registered.get('validate_dsh_ui')).toBe(1)
    validation = 'skip'
    ctx.emit('loader/volatile-update' as never)
    expect(registered.get('validate_dsh_ui')).toBe(0)
    const section = (await ctx.systemPrompt.assemble({})).sections.find(item => item.name === 'genui:fence')
    expect(section?.text).not.toContain('validate_dsh_ui')
    validation = 'uncertain'
    ctx.emit('loader/volatile-update' as never)
    expect(registered.get('validate_dsh_ui')).toBe(1)
    await fork.dispose()
    expect(registered.get('validate_dsh_ui')).toBe(0)
  })
})

describe('SKILL.md passages', () => {
  const skill = readFileSync('SKILL.md', 'utf8')

  it('routes prose answers away from the skill', () => {
    const description = /^description: "(.+)"$/mu.exec(skill)?.[1] ?? ''
    expect(description).toContain('stay Markdown however long')
    expect(description).not.toContain('key points')
  })

  it('drops every validate_dsh_ui instruction when validation is skipped', () => {
    expect(adaptSkillContent(skill, config({ validation: 'skip' }))).not.toContain('validate_dsh_ui')
    expect(adaptSkillContent(skill, config({}))).toContain('先验后发')
    expect(adaptSkillContent(skill, config({ validation: 'uncertain' }))).toContain('拿不准再验')
  })

  it('carries the dsh-html section only when drawings are on, and the script note per setting', () => {
    expect(adaptSkillContent(skill, config({}))).toContain('## 自定义画面：```dsh-html')
    expect(adaptSkillContent(skill, config({ html: { enabled: false } }))).not.toContain('## 自定义画面')
    expect(adaptSkillContent(skill, config({ html: { scripts: false } }))).toContain('**脚本已禁用**')
    expect(adaptSkillContent(skill, config({}))).not.toContain('**脚本已禁用**')
  })

  it('leaves no markers behind and keeps unknown keys', () => {
    for (const raw of [{}, { validation: 'skip', html: { enabled: false } }, { html: { scripts: false } }]) {
      expect(adaptSkillContent(skill, config(raw))).not.toMatch(/genui:(if|end)/u)
    }
    expect(adaptSkillContent('<!-- genui:if mystery=on -->\nkeep\n<!-- genui:end -->\n', config({}))).toBe('keep\n')
  })
})
