import { describe, expect, it } from 'vitest'
import { sourceFencesOf } from '../src/client/source-fence.ts'
import { isGenuiFenceLanguage, normalizeFenceLanguage } from '../src/shared/fence-language.ts'

describe('sourceFencesOf', () => {
  it('reads one dsh-ui fence surrounded by Markdown and ignores inline code', () => {
    expect(sourceFencesOf('before `inline` text\n\n```dsh-ui\n{"items":[]}\n```\n\nafter')).toEqual([
      { lang: 'dsh-ui', value: '{"items":[]}', openingLineComplete: true },
    ])
  })

  it('preserves language and order for multiple and unlabelled fences', () => {
    expect(sourceFencesOf('```ts\na()\n```\n```\nplain\n```\n```foobar\nx\n```')).toEqual([
      { lang: 'ts', value: 'a()', openingLineComplete: true },
      { lang: null, value: 'plain', openingLineComplete: true },
      { lang: 'foobar', value: 'x', openingLineComplete: true },
    ])
  })

  it('recognizes an unclosed streaming dsh-ui fence', () => {
    expect(sourceFencesOf('```dsh-ui\n{"items":[{')).toEqual([
      { lang: 'dsh-ui', value: '{"items":[{', openingLineComplete: true },
    ])
  })

  it('keeps an unfinished opening line provisional', () => {
    expect(sourceFencesOf('```dsh-ui')).toEqual([
      { lang: 'dsh-ui', value: '', openingLineComplete: false },
    ])
  })

  it('reads fences nested inside Markdown containers', () => {
    expect(sourceFencesOf('> ```foobar\n> nested\n> ```')).toEqual([
      { lang: 'foobar', value: 'nested', openingLineComplete: true },
    ])
  })

})

describe('normalizeFenceLanguage', () => {
  it('absorbs the trailing punctuation a model leaves on the fence label', () => {
    // 真实会话：同一模型在一条消息里写出 182 个 ```dsh-ui> 围栏，全部静默退化成
    // 普通代码块，因为宿主的 mdast lang 原样保留了那个 `>`。
    for (const raw of ['dsh-ui>', 'dsh-ui`', 'dsh-ui"', 'dsh-ui.', 'dsh-ui)', 'dsh-ui】', 'dsh-ui」']) {
      expect(normalizeFenceLanguage(raw)).toBe('dsh-ui')
    }
  })

  it('absorbs case and surrounding whitespace', () => {
    expect(normalizeFenceLanguage('DSH-UI')).toBe('dsh-ui')
    expect(normalizeFenceLanguage('  dsh-ui  ')).toBe('dsh-ui')
  })

  it('leaves a genuinely different language untouched', () => {
    expect(normalizeFenceLanguage('dsh-ui-special')).toBe('dsh-ui-special')
    expect(normalizeFenceLanguage('json')).toBe('json')
    expect(normalizeFenceLanguage('svg')).toBe('svg')
    expect(normalizeFenceLanguage('')).toBe('')
  })
})

describe('isGenuiFenceLanguage', () => {
  it('treats noisy variants as GenUI and other languages as not', () => {
    expect(isGenuiFenceLanguage('dsh-ui')).toBe(true)
    expect(isGenuiFenceLanguage('dsh-ui>')).toBe(true)
    expect(isGenuiFenceLanguage('json')).toBe(false)
    expect(isGenuiFenceLanguage(null)).toBe(false)
    expect(isGenuiFenceLanguage(undefined)).toBe(false)
  })
})

describe('sourceFencesOf language normalization', () => {
  it('normalizes a noisy dsh-ui label so takeover no longer skips the fence', () => {
    expect(sourceFencesOf('```dsh-ui>\n{"items":[]}\n```')).toEqual([
      { lang: 'dsh-ui', value: '{"items":[]}', openingLineComplete: true },
    ])
  })

  it('keeps unrelated labels and unlabelled fences as they are', () => {
    expect(sourceFencesOf('```ts\na()\n```\n```\nplain\n```')).toEqual([
      { lang: 'ts', value: 'a()', openingLineComplete: true },
      { lang: null, value: 'plain', openingLineComplete: true },
    ])
  })
})
