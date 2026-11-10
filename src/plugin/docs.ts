/**
 * `genui_docs`: on-demand GenUI reference (fork: forever-lwy).
 *
 * The always-present prompt lists what exists; the `genui` skill carries the
 * judgment and layout rules; component fields, variants, limits and examples
 * live in `reference/components.md` and `reference/topics.md` and reach the
 * model only for the components and topics it decided to use. Sections are
 * `## key / alias` headings. Returned text passes through the same
 * settings filter as the skill (`<!-- genui:if … -->` blocks).
 * @module @forever-lwy/dsh-genui/plugin/docs
 */
import { readFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ContentBlock } from '@deepseek-ai/dsh-llm'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import type { ToolDefinition } from '@deepseek-ai/dsh-tools'
import type { GenuiConfig } from '../shared/genui-config.ts'
import { adaptSkillContent } from './skill-content.ts'

export interface DocSection {
  /** Canonical key (first name in the heading). */
  key: string
  kind: 'component' | 'topic'
  text: string
}

export interface DocIndex {
  sections: Map<string, DocSection>
  components: string[]
  topics: string[]
}

/** Package root: lib/index.js → .., src/plugin/docs.ts → ../.. */
export function packageRoot(): string {
  const directory = dirname(fileURLToPath(new URL(import.meta.url)))
  return basename(directory) === 'plugin' ? resolve(directory, '../..') : resolve(directory, '..')
}

/** Split a reference file into `## key / alias` sections. */
export function parseSections(markdown: string, kind: DocSection['kind']): DocSection[] {
  const sections: DocSection[] = []
  const parts = markdown.split(/^## /mu).slice(1)
  for (const part of parts) {
    const newline = part.indexOf('\n')
    const heading = (newline < 0 ? part : part.slice(0, newline)).trim()
    const names = heading.split('/').map(name => name.trim()).filter(Boolean)
    if (names.length === 0) continue
    sections.push({ key: names.join(' / '), kind, text: `## ${part.trimEnd()}` })
  }
  return sections
}

/** Read and index the reference files once. */
export function loadDocIndex(root = packageRoot()): DocIndex {
  const sections = new Map<string, DocSection>()
  const components: string[] = []
  const topics: string[] = []
  const register = (section: DocSection): void => {
    const names = section.key.split(' / ')
    for (const name of names) sections.set(name.toLowerCase(), section)
    ;(section.kind === 'component' ? components : topics).push(names[0]!)
  }
  for (const section of parseSections(readFileSync(resolve(root, 'reference/components.md'), 'utf8'), 'component')) register(section)
  for (const section of parseSections(readFileSync(resolve(root, 'reference/topics.md'), 'utf8'), 'topic')) register(section)
  try {
    const icons = readFileSync(resolve(root, 'ICON-NAMES.md'), 'utf8')
    register({ key: 'icon-names', kind: 'topic', text: `## icon-names\n\n${icons.trim()}` })
  } catch {
    // Older packages without the list still answer every other key.
  }
  return { sections, components, topics }
}

/** Per-call cap on requested keys: a large ask is a sign of reading "everything". */
const MAX_ITEMS = 16

function namesOf(args: unknown): string[] {
  const record = (args !== null && typeof args === 'object' ? args : {}) as Record<string, unknown>
  const raw = record.items ?? record.item ?? record.names
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(/[\s,，、]+/u) : []
  return [...new Set(list.filter((item): item is string => typeof item === 'string').map(item => item.trim().toLowerCase()).filter(Boolean))]
}

/** Answer one request: the sections asked for, filtered by settings, plus what was not found. */
export function answerDocs(index: DocIndex, config: GenuiConfig, args: unknown): string {
  const names = namesOf(args)
  const available = `components: ${index.components.join(', ')}\ntopics: ${index.topics.filter(topic => config.html.enabled || topic !== 'html').join(', ')}`
  if (names.length === 0) return `[genui-docs] error=missing_items\nPass items, e.g. {"items":["table","chart"]}.\n${available}`
  const picked: DocSection[] = []
  const unknown: string[] = []
  for (const name of names.slice(0, MAX_ITEMS)) {
    const section = index.sections.get(name)
    if (section === undefined || (section.key === 'html' && !config.html.enabled)) unknown.push(name)
    else if (!picked.includes(section)) picked.push(section)
  }
  const parts = picked.map(section => adaptSkillContent(section.text, config).trim())
  const notes: string[] = []
  if (names.length > MAX_ITEMS) notes.push(`only the first ${MAX_ITEMS} items were read; ask again for the rest`)
  if (unknown.length > 0) notes.push(`unknown=${unknown.join(',')}\n${available}`)
  return [`[genui-docs] ${picked.map(section => section.key.split(' / ')[0]).join(', ') || 'none'}`, ...parts, ...notes].join('\n\n')
}

const DESCRIPTION =
  'GenUI reference on demand: fields, variants, limits and examples for the dsh-ui components and topics you are about to use. '
  + 'Call it once you have decided which components a reply needs (only for ones not read earlier in this conversation), then write the fence. '
  + 'items: component type names (e.g. "table", "chart", "choices", "diagram") and/or topics: layouts, theme, html, interaction, when, computed, rich-text, local-files, icon-names.'

const PARAMETERS: Record<string, unknown> = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: MAX_ITEMS,
      description: 'Component type names and/or topic names to read.',
    },
  },
  required: ['items'],
  additionalProperties: false,
}

/** Build the tool; the index is read lazily on the first call. */
export function createGenuiDocsTool(config: () => GenuiConfig, load: () => DocIndex = loadDocIndex): ToolDefinition {
  let index: DocIndex | undefined
  return {
    name: 'genui_docs',
    description: DESCRIPTION,
    parameters: PARAMETERS,
    output: {
      schema: { type: 'string', description: 'The requested reference sections.' },
      render(_args: unknown, value: JsonValue): ContentBlock[] {
        return [{ type: 'text', text: String(value) }]
      },
    },
    async execute(args: unknown): Promise<JsonValue> {
      index ??= load()
      return answerDocs(index, config(), args)
    },
  } as ToolDefinition
}
