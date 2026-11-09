/**
 * Export one finished assistant answer as a single HTML file that keeps its
 * rendering (fork: forever-lwy).
 *
 * The answer is copied from the live DOM, so Markdown, code highlighting,
 * math and the host theme look exactly as on screen:
 *
 * - the turn's assistant rows are cloned inside shallow copies of their
 *   ancestors (tag, class, data-*), so the host's descendant selectors still
 *   match; reasoning, tool rows, action bars and hidden source blocks are
 *   dropped;
 * - every same-origin stylesheet is inlined; @font-face sources the page has
 *   actually loaded are embedded, and so are images (local `/api/file` ones
 *   need the session's cookie, which a saved file would not have);
 * - GenUI blocks are re-mounted live by the standalone runtime from their
 *   artifact (spec + current answers), so charts, tabs and quizzes still
 *   work; when that is not possible the static DOM is kept, with canvases
 *   frozen to images;
 * - ```dsh-html drawings get a fresh sandboxed frame with the theme frozen at
 *   export time.
 * @module @forever-lwy/dsh-genui/client/answer-export
 */
import { analyzeGenuiPortability } from './artifact/portability.ts'
import { bootstrapSource, bundleElement, bytesToBase64, cachedBundle, escapeHtml, resolveMediaUrls } from './artifact/html.ts'
import { exportableBlockOf } from './artifact/registry.ts'
import { downloadBlob, sanitizeArtifactFilename } from './artifact/download.ts'
import type { GenuiArtifactV1, GenuiStandaloneAsset } from './artifact/types.ts'
import { htmlFrameRecordOf } from './html-fence.tsx'
import { readHostTheme } from './host-theme.ts'
import { buildHtmlFrameDocument, FRAME_MESSAGE_TAG, FRAME_SANDBOX, randomToken } from './html-frame.ts'

/** Rows of one turn that make up the visible answer. */
const ANSWER_KINDS = new Set(['assistant-step'])
/** Rows that start a turn: the walk back stops here. */
const TURN_START_KINDS = new Set(['user', 'steering', 'turn-trigger'])

/** Removed from every cloned row. */
const DROP_SELECTORS = [
  '[data-chat-group-part="reasoning"]',
  '[data-tool]',
  '[data-genui-rendered]',
  '[data-genui-export]',
  '.genui-html-tools',
  '.genui-dom-fence-diagnostic',
  'button[aria-label]:not([data-genui] button):not([data-genui-artifact] button)',
  'script',
  'noscript',
  'template',
  '[hidden]',
].join(',')

const MAX_ASSET_BYTES = 12 * 1024 * 1024
const MAX_TOTAL_INLINE_BYTES = 48 * 1024 * 1024

export class AnswerExportError extends Error {}

/**
 * The assistant rows of the turn that `anchor` (an element inside that
 * turn's action row) belongs to, in document order.
 */
export function collectAnswerRows(anchor: Element): HTMLElement[] {
  const own = anchor.closest<HTMLElement>('[data-chat-flow-kind]')
  if (own === null) return []
  const turn = own.getAttribute('data-chat-turn')
  const parent = own.parentElement
  if (turn !== null && parent !== null) {
    const rows = [...parent.children].filter((row): row is HTMLElement =>
      row instanceof HTMLElement && row.getAttribute('data-chat-turn') === turn
      && ANSWER_KINDS.has(row.getAttribute('data-chat-flow-kind') ?? ''))
    if (rows.length > 0) return rows
  }
  // No turn marker: walk back to the turn's start.
  const rows: HTMLElement[] = []
  if (ANSWER_KINDS.has(own.getAttribute('data-chat-flow-kind') ?? '')) rows.push(own)
  for (let row = own.previousElementSibling; row !== null; row = row.previousElementSibling) {
    const kind = row.getAttribute('data-chat-flow-kind') ?? ''
    if (TURN_START_KINDS.has(kind)) break
    if (row instanceof HTMLElement && ANSWER_KINDS.has(kind)) rows.unshift(row)
  }
  return rows
}

/** Shallow copy keeping what selectors match on, never inline geometry. */
function shell(element: Element, doc: Document): HTMLElement {
  const copy = doc.createElement(element.tagName.toLowerCase())
  for (const attribute of [...element.attributes]) {
    const name = attribute.name
    if (name === 'class' || name === 'dir' || name === 'lang' || name === 'role' || name.startsWith('data-')) {
      copy.setAttribute(name, attribute.value)
    }
  }
  copy.setAttribute('data-genui-export-shell', '')
  return copy
}

function absoluteUrl(url: string, base: string): string | undefined {
  try {
    return new URL(url, base).href
  } catch {
    return undefined
  }
}

async function fetchDataUrl(url: string, budget: { left: number }): Promise<string | undefined> {
  try {
    const response = await fetch(url, { credentials: 'include' })
    if (!response.ok) return undefined
    const blob = await response.blob()
    if (blob.size > MAX_ASSET_BYTES || blob.size > budget.left) return undefined
    budget.left -= blob.size
    const bytes = new Uint8Array(await blob.arrayBuffer())
    return `data:${blob.type || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`
  } catch {
    return undefined
  }
}

/** Families of the font faces the page has loaded (only those are worth embedding). */
function loadedFontFamilies(): Set<string> {
  const families = new Set<string>()
  try {
    for (const face of document.fonts as unknown as Iterable<FontFace>) {
      if (face.status === 'loaded') families.add(face.family.replace(/^["']|["']$/gu, '').toLowerCase())
    }
  } catch {
    // FontFaceSet not iterable: embed nothing, the export falls back to system fonts.
  }
  return families
}

const URL_IN_CSS = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gu

/** Inline the page's styles; fonts in use are embedded, other urls made absolute. */
async function collectCss(budget: { left: number }): Promise<string> {
  const fonts = loadedFontFamilies()
  const parts: string[] = []
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue // cross-origin sheet
    }
    const base = sheet.href ?? document.baseURI
    for (const rule of [...rules]) {
      let text = rule.cssText
      // `type` rather than instanceof: CSSFontFaceRule is missing in some DOMs.
      if (rule.type === 5 /* FONT_FACE_RULE */) {
        const family = (rule as CSSFontFaceRule).style.getPropertyValue('font-family').replace(/^["']|["']$/gu, '').trim().toLowerCase()
        if (!fonts.has(family)) continue
        const urls = [...text.matchAll(URL_IN_CSS)].map(match => match[2]!).filter(url => !url.startsWith('data:'))
        for (const url of urls) {
          const absolute = absoluteUrl(url, base)
          const data = absolute === undefined ? undefined : await fetchDataUrl(absolute, budget)
          if (data !== undefined) text = text.split(url).join(data)
        }
      } else if (text.includes('url(')) {
        text = text.replace(URL_IN_CSS, (whole, quote: string, url: string) => {
          if (url.startsWith('data:') || url.startsWith('#')) return whole
          const absolute = absoluteUrl(url, base)
          return absolute === undefined ? whole : `url(${quote}${absolute}${quote})`
        })
      }
      parts.push(text)
    }
  }
  return parts.join('\n')
}

interface Collected {
  artifacts: GenuiArtifactV1[]
  frames: Array<{ srcdoc: string; height: number }>
  needsScripts: boolean
  needsRemote: boolean
}

/** Freeze a live canvas into an image on its clone (WebGL may come out blank). */
function freezeCanvas(live: HTMLCanvasElement, clone: Element, doc: Document): void {
  try {
    const img = doc.createElement('img')
    img.src = live.toDataURL('image/png')
    img.width = live.clientWidth || live.width
    img.height = live.clientHeight || live.height
    img.setAttribute('style', `width:${img.width}px;height:${img.height}px;max-width:100%`)
    clone.replaceWith(img)
  } catch {
    // Tainted canvas: leave the empty clone.
  }
}

/**
 * Clone the rows into `host`, swapping live parts for exportable ones.
 * Marks are set on the live elements only for the duration of the clone.
 */
function cloneRows(rows: HTMLElement[], host: HTMLElement, doc: Document, collected: Collected): void {
  const marked: Element[] = []
  const live = new Map<string, Element>()
  let counter = 0
  const mark = (element: Element): void => {
    const id = String(counter++)
    element.setAttribute('data-genui-export-id', id)
    marked.push(element)
    live.set(id, element)
  }
  try {
    for (const row of rows) {
      for (const element of row.querySelectorAll('[data-genui-artifact], [data-genui-html], canvas')) mark(element)
    }
    for (const row of rows) host.appendChild(row.cloneNode(true))
  } finally {
    for (const element of marked) element.removeAttribute('data-genui-export-id')
  }
  for (const element of host.querySelectorAll(DROP_SELECTORS)) element.remove()
  const theme = readHostTheme(rows[0] ?? null)
  for (const clone of [...host.querySelectorAll('[data-genui-export-id]')]) {
    const original = live.get(clone.getAttribute('data-genui-export-id') ?? '')
    clone.removeAttribute('data-genui-export-id')
    // The page is built detached, so containment (not isConnected) says whether
    // an earlier replacement already took this clone out.
    if (original === undefined || !host.contains(clone)) continue
    if (original.hasAttribute('data-genui-artifact')) {
      const getArtifact = exportableBlockOf(original)
      let artifact: GenuiArtifactV1 | undefined
      try {
        artifact = getArtifact?.()
      } catch {
        artifact = undefined
      }
      if (artifact !== undefined && analyzeGenuiPortability(artifact.spec).customTypes.length === 0) {
        const slot = doc.createElement('div')
        slot.setAttribute('data-genui-export-block', String(collected.artifacts.length))
        collected.artifacts.push({ ...artifact, spec: resolveMediaUrls(artifact.spec, document.baseURI) })
        // The static copy stays inside as the no-script fallback; the runtime replaces it.
        slot.appendChild(clone.cloneNode(true))
        clone.replaceWith(slot)
        continue
      }
      // Static fallback: freeze this block's canvases.
      const liveCanvases = [...original.querySelectorAll('canvas')]
      const cloneCanvases = [...clone.querySelectorAll('canvas')]
      liveCanvases.forEach((canvas, index) => {
        const target = cloneCanvases[index]
        if (target !== undefined) freezeCanvas(canvas, target, doc)
      })
      continue
    }
    if (original.hasAttribute('data-genui-html')) {
      const record = htmlFrameRecordOf(original)
      if (record === undefined) { clone.remove(); continue }
      const frameId = randomToken()
      collected.frames.push({ srcdoc: buildHtmlFrameDocument(record.raw, { frameId, scripts: record.scripts, remote: record.remote, theme }), height: record.height })
      collected.needsScripts ||= record.scripts
      collected.needsRemote ||= record.remote
      const slot = doc.createElement('div')
      slot.setAttribute('data-genui-export-frame', String(collected.frames.length - 1))
      slot.setAttribute('data-frame-id', frameId)
      clone.replaceWith(slot)
      continue
    }
    if (original instanceof HTMLCanvasElement) freezeCanvas(original, clone, doc)
  }
}

/** Embed every image the clone references (blob:, same-origin and remote alike). */
async function inlineImages(host: HTMLElement, budget: { left: number }): Promise<void> {
  const images = [...host.querySelectorAll('img')]
  await Promise.all(images.map(async img => {
    img.removeAttribute('srcset')
    img.removeAttribute('loading')
    const src = img.getAttribute('src') ?? ''
    if (src === '' || src.startsWith('data:')) return
    const absolute = absoluteUrl(src, document.baseURI)
    if (absolute === undefined) return
    const data = await fetchDataUrl(absolute, budget)
    img.setAttribute('src', data ?? absolute)
  }))
}

/** Script in the exported page: size and theme for frames, runtime mount for blocks. */
function exportPageScript(): string {
  return `
(function(){
  var TAG=${JSON.stringify(FRAME_MESSAGE_TAG)};
  var docs=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(document.getElementById('genui-export-frames').textContent.trim()),function(c){return c.charCodeAt(0)})));
  document.querySelectorAll('[data-genui-export-frame]').forEach(function(slot){
    var entry=docs[Number(slot.getAttribute('data-genui-export-frame'))];if(!entry)return;
    var frame=document.createElement('iframe');
    frame.setAttribute('sandbox',${JSON.stringify(FRAME_SANDBOX)});
    frame.setAttribute('referrerpolicy','no-referrer');
    frame.style.cssText='display:block;width:100%;border:0;background:transparent;height:'+(entry.height||120)+'px';
    frame.srcdoc=entry.srcdoc;
    var id=slot.getAttribute('data-frame-id');
    addEventListener('message',function(e){if(e.source!==frame.contentWindow)return;var m=e.data;if(!m||m[TAG]!==id)return;
      if(m.type==='size'&&typeof m.height==='number')frame.style.height=Math.max(1,Math.min(10000,Math.ceil(m.height)))+'px'});
    slot.replaceWith(frame);
  });
})();`
}

function runtimeMountScript(): string {
  return `
${bootstrapSource().replace(/async function start\(\)[\s\S]*$/u, '')}
(async function(){
  for (const element of document.querySelectorAll('[data-genui-bundle]')) await loadBundle(element);
  const encoded=document.getElementById('genui-export-artifacts').textContent.trim();
  const artifacts=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(encoded),function(c){return c.charCodeAt(0)})));
  document.querySelectorAll('[data-genui-export-block]').forEach(function(slot){
    const artifact=artifacts[Number(slot.getAttribute('data-genui-export-block'))];if(!artifact)return;
    const root=document.createElement('div');root.setAttribute('data-genui-export-live','');
    try{window.__GenuiStandalone__.mount(root,artifact);slot.replaceChildren(root)}catch(e){/* keep the static copy */}
  });
})().catch(function(){/* static copies stay */});`
}

const EXPORT_LAYOUT_CSS = `
html,body{height:auto !important;min-height:0 !important;overflow:auto !important}
[data-genui-export-shell]{display:block !important;width:auto !important;max-width:none !important;height:auto !important;min-height:0 !important;max-height:none !important;margin:0 !important;padding:0 !important;overflow:visible !important;position:static !important;transform:none !important;contain:none !important;inset:auto !important;flex:none !important;grid-area:auto !important}
[data-genui-export-page]{max-width:860px;margin:0 auto;padding:32px 20px 64px}
[data-genui-export-header]{font:13px/1.5 system-ui,sans-serif;opacity:.6;margin:0 0 20px}
[data-genui-export-block]>[data-genui-export-live]{display:block}
`

export interface AnswerExportOptions {
  /** Title for the file name and the page; defaults to the document title. */
  title?: string
}

/** Build the export document for the answer `anchor` belongs to. */
export async function buildAnswerHtml(anchor: Element, options: AnswerExportOptions = {}): Promise<string> {
  const rows = collectAnswerRows(anchor)
  if (rows.length === 0) throw new AnswerExportError('empty')
  const doc = document.implementation.createHTMLDocument('')
  const collected: Collected = { artifacts: [], frames: [], needsScripts: false, needsRemote: false }
  // Ancestor shells from <body> down to the rows' parent.
  const chain: Element[] = []
  for (let element = rows[0]!.parentElement; element !== null && element !== document.body; element = element.parentElement) chain.unshift(element)
  const page = doc.createElement('main')
  page.setAttribute('data-genui-export-page', '')
  let host: HTMLElement = page
  for (const ancestor of chain) {
    const copy = shell(ancestor, doc)
    host.appendChild(copy)
    host = copy
  }
  cloneRows(rows, host, doc, collected)
  if (host.textContent?.trim() === '' && host.querySelector('img, svg, [data-genui-export-block], [data-genui-export-frame]') === null) {
    throw new AnswerExportError('empty')
  }
  const budget = { left: MAX_TOTAL_INLINE_BYTES }
  const [css] = await Promise.all([collectCss(budget), inlineImages(host, budget)])

  // GenUI runtime + the engines the blocks need.
  let runtimePart = ''
  if (collected.artifacts.length > 0) {
    const assets = new Set<GenuiStandaloneAsset>()
    for (const artifact of collected.artifacts) for (const asset of analyzeGenuiPortability(artifact.spec).requiredAssets) assets.add(asset)
    try {
      const engines = await Promise.all([...assets].map(async name => bundleElement(name, await cachedBundle(`${name}.js`, name))))
      const runtime = await cachedBundle('standalone-runtime.js', 'runtime')
      const encoded = bytesToBase64(new TextEncoder().encode(JSON.stringify(collected.artifacts)))
      runtimePart = `<script type="application/octet-stream" id="genui-export-artifacts">${encoded}</script>
${engines.join('\n')}
${bundleElement('runtime', runtime)}
<script>${runtimeMountScript()}</script>`
    } catch {
      // Runtime unavailable: the static copies inside each slot remain.
    }
  }
  const framesPart = collected.frames.length === 0 ? '' : `<script type="application/octet-stream" id="genui-export-frames">${bytesToBase64(new TextEncoder().encode(JSON.stringify(collected.frames)))}</script>
<script>${exportPageScript()}</script>`

  const remote = collected.needsRemote ? ' https:' : ''
  // srcdoc frames inherit this policy, so it must admit what their own allows.
  const csp = [
    "default-src 'none'",
    `script-src 'unsafe-inline' blob:${collected.needsScripts ? " 'unsafe-eval'" : ''}${remote}`,
    `style-src 'unsafe-inline'${remote}`,
    'font-src data: https:',
    'img-src data: blob: https: http:',
    'media-src data: blob: https: http:',
    collected.needsScripts ? 'worker-src blob:' : "worker-src 'none'",
    "connect-src 'none'",
    "frame-src 'self' about: data:",
    "object-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ')
  const title = (options.title ?? document.title ?? '').trim() || 'DSH'
  const htmlAttrs = [...document.documentElement.attributes].filter(a => a.name === 'class' || a.name === 'lang' || a.name === 'dir' || a.name === 'style' || a.name.startsWith('data-'))
    .map(a => ` ${a.name}="${escapeHtml(a.value)}"`).join('')
  const bodyAttrs = [...document.body.attributes].filter(a => a.name === 'class' || a.name === 'dir' || a.name === 'style' || a.name.startsWith('data-'))
    .map(a => ` ${a.name}="${escapeHtml(a.value)}"`).join('')
  const exportedAt = new Date().toLocaleString()
  return `<!doctype html>
<html${htmlAttrs}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${escapeHtml(csp)}">
<meta name="referrer" content="no-referrer">
<meta name="generator" content="@forever-lwy/dsh-genui answer export">
<title>${escapeHtml(title)}</title>
<style>${css.replace(/<\/style/giu, '<\\/style')}</style>
<style>${EXPORT_LAYOUT_CSS}</style>
</head>
<body${bodyAttrs}>
<p data-genui-export-header>${escapeHtml(title)} · ${escapeHtml(exportedAt)}</p>
${page.outerHTML}
${framesPart}
${runtimePart}
</body>
</html>`
}

/** Build and download; resolves once the download has been handed to the browser. */
export async function downloadAnswerHtml(anchor: Element, options: AnswerExportOptions = {}): Promise<void> {
  const html = await buildAnswerHtml(anchor, options)
  const title = (options.title ?? document.title ?? '').trim()
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/gu, '-')
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), sanitizeArtifactFilename(`${title || 'answer'} ${stamp}`, '.html'))
}
