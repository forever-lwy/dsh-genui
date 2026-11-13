import { fromMarkdown } from 'mdast-util-from-markdown'
import { normalizeFenceLanguage } from '../shared/fence-language.ts'

export interface SourceFence {
  lang: string | null
  value: string
  openingLineComplete: boolean
}

interface MarkdownNode {
  type: string
  lang?: string | null
  value?: string
  children?: MarkdownNode[]
  position?: { start: { offset?: number } }
}

/**
 * 按 Markdown 文档顺序读取所有代码围栏。
 *
 * @param markdown - assistant text block 中的 Markdown 内容
 * @returns Markdown AST 中的代码围栏
 */
export function sourceFencesOf(markdown: string): SourceFence[] {
  const fences: SourceFence[] = []
  const visit = (node: MarkdownNode): void => {
    if (node.type === 'code') {
      const openingOffset = node.position?.start.offset
      const openingLineEnd = openingOffset === undefined ? -1 : markdown.indexOf('\n', openingOffset)
      const rawLang = node.lang ?? null
      fences.push({
        lang: rawLang === null ? null : normalizeFenceLanguage(rawLang),
        value: node.value as string,
        openingLineComplete: openingLineEnd >= 0,
      })
    }
    for (const child of node.children ?? []) visit(child)
  }
  visit(fromMarkdown(markdown) as unknown as MarkdownNode)
  return fences
}
