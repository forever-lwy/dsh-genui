/**
 * GenUI plugin: teaches the model the ```dsh-ui fence syntax for emitting
 * declarative UI components inline in its reply. The browser half renders the
 * fence through GenuiBlock (ui-primitives); this host half only tells the
 * model the language exists, so a session without the plugin simply never
 * emits fences and nothing changes.
 *
 * The section uses the host's centrally allocated structured-output placement.
 * @module @changfenhuang/dsh-genui
 */

import { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import type { SkillProvider } from '@deepseek-ai/dsh-skill'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRenderUiTool, createValidateDshUiTool } from './tool.ts'
import { installFenceFeedback } from './fence-feedback.ts'
import { installDshGoNative } from './dsh-go-native.ts'
import { buildGenuiSectionText } from './prompt.ts'
import { snapshotGenuiConfig, type GenuiConfig } from './config.ts'
import { adaptSkillContent } from './skill-content.ts'
import { createGenuiDocsTool } from './docs.ts'

/* ---------------- lazy engine asset route ---------------- */

/**
 * The mermaid/three engines ship as standalone IIFE bundles under
 * `lib/assets/` and are fetched by the client ONLY when a spec needs them.
 * This route serves them from the plugin's own package directory through the
 * host webserver service — the longest-prefix rule lets it win over the
 * generic `/plugins` bundle route, and no host source change is needed. The
 * service is optional at this plugin's start time, so a dependency fiber owns
 * the registration and follows the webserver through late binding, replacement,
 * and plugin reloads.
 */

/** Route prefix under /plugins; anything under it is this plugin's asset. */
const ASSET_ROUTE_PATH = '/plugins/@forever-lwy/dsh-genui/assets'

/** Safe flat file names only: no slashes, no traversal, js assets only. */
const ASSET_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.js$/

/** The handler itself (registered via the optional webServer probe). */
async function serveGenuiAsset(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405)
    res.end()
    return
  }
  let pathname: string
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)
  } catch {
    res.writeHead(400)
    res.end()
    return
  }
  const rel = pathname.startsWith(`${ASSET_ROUTE_PATH}/`) ? pathname.slice(ASSET_ROUTE_PATH.length) : null
  if (rel === null) {
    res.writeHead(404)
    res.end()
    return
  }
  const file = rel.slice(1)
  if (!ASSET_FILE_RE.test(file)) {
    res.writeHead(404)
    res.end()
    return
  }
  try {
    // lib/index.js → ./assets/ = <pkg>/lib/assets/ (the tsdown asset outDir).
    const dir = fileURLToPath(new URL('./assets/', import.meta.url))
    const body = await readFile(join(dir, file))
    res.writeHead(200, {
      'content-type': 'text/javascript; charset=utf-8',
      'cache-control': 'no-cache',
    })
    res.end(body)
  } catch {
    // Missing asset (old build) — a loud 404; the client shows its fallback.
    res.writeHead(404)
    res.end()
  }
}

export { GENUI_SECTION_TEXT, buildGenuiSectionText } from './prompt.ts'
export { Config } from './config.ts'
export type { GenuiConfig } from './config.ts'

/**
 * Register the GenUI output-language section and the render_ui tool.
 * @param ctx - cordis context.
 */
// `tools` is intentionally NOT injected: the service is optional for this
// plugin — hosts without tool access keep the fence channel working. Cordis
// inject entries are hard requirements, so the registry is probed at runtime
// instead (see apply).
export const name = '@changfenhuang/dsh-genui'
export const inject = ['systemPrompt']

const BUNDLED_SKILL_RANK = 600
const BUNDLED_SKILL_PROVIDER = 'dsh-genui'
const BUNDLED_SKILL_INVOCATION = { modelInvocable: true, userInvocable: true } as const

/**
 * The frontmatter field the routing description comes from.
 *
 * A second copy of this sentence in code drifted from SKILL.md unnoticed, and the
 * panel showed the code copy while the model read the same string — so an edit to
 * the skill's own frontmatter changed nothing. The file is the only source.
 */
function frontmatterField(front: string, key: string): string | undefined {
  const line = new RegExp('^\\s*' + key + '\\s*:\\s*(.+?)\\s*$', 'mu').exec(front)
  return line?.[1]?.replace(/^['"]|['"]$/gu, '')
}

/** Register through the provider path so source=bundled also gets bundled precedence. */
function bundledSkillProvider(config: () => GenuiConfig): SkillProvider {
  const moduleDirectory = dirname(fileURLToPath(new URL(import.meta.url)))
  const path = basename(moduleDirectory) === 'plugin'
    ? resolve(moduleDirectory, '../../SKILL.md')
    : resolve(moduleDirectory, '../SKILL.md')
  const raw = readFileSync(path, 'utf8')
  const end = raw.indexOf('\n---\n', 4)
  if (!raw.startsWith('---\n') || end < 0) throw new Error('genui SKILL.md has invalid frontmatter')
  const description = frontmatterField(raw.slice(4, end), 'description')
  if (description === undefined) throw new Error('genui SKILL.md frontmatter has no description')
  return {
    name: BUNDLED_SKILL_PROVIDER,
    list: () => Promise.resolve([{
      name: 'genui',
      description,
      invocation: BUNDLED_SKILL_INVOCATION,
      source: 'bundled',
      provider: BUNDLED_SKILL_PROVIDER,
      path,
      resourceBase: { kind: 'directory', path: dirname(path) },
      rank: BUNDLED_SKILL_RANK,
      locator: path,
    }]),
    get: () => Promise.resolve({
      name: 'genui',
      description,
      invocation: BUNDLED_SKILL_INVOCATION,
      source: 'bundled',
      provider: BUNDLED_SKILL_PROVIDER,
      path,
      resourceBase: { kind: 'directory', path: dirname(path) },
      content: adaptSkillContent(raw.slice(end + 5), config()),
    }),
  }
}

export function apply(ctx: Context, input?: unknown): void {
  installDshGoNative(ctx)
  // Fork: every setting is volatile (the DSH settings page edits it in place
  // and the loader emits `loader/volatile-update` instead of remounting), so
  // everything below reads the current snapshot rather than a captured value.
  let config = snapshotGenuiConfig(input)
  ctx.systemPrompt.section({
    name: 'genui:fence',
    order: ctx.systemPrompt.getSectionOrder('STRUCTURED_OUTPUT'),
    text: () => buildGenuiSectionText(config),
  })
  installFenceFeedback(ctx, () => config.fenceFeedback, () => config.renderUiTool)
  // Hosts without tool access keep the fence channel. The dependency fiber
  // starts whenever tools becomes available and unloads its registrations
  // before either the service or this plugin is replaced. A settings change
  // that adds or removes a tool re-registers the set.
  const docsTool = createGenuiDocsTool(() => config)
  let toolsCtx: Context | undefined
  let disposeTools: () => void = () => {}
  let registered = ''
  const syncTools = (): void => {
    const scope = toolsCtx
    const wanted = `${config.renderUiTool}:${config.validation !== 'skip'}`
    if (scope === undefined || wanted === registered) return
    disposeTools()
    const disposers: Array<() => void> = []
    if (config.renderUiTool) disposers.push(scope.tools.register(createRenderUiTool()) as unknown as () => void)
    if (config.validation !== 'skip') disposers.push(scope.tools.register(createValidateDshUiTool()) as unknown as () => void)
    // Fork: component details are read on demand instead of living in the skill body.
    disposers.push(scope.tools.register(docsTool) as unknown as () => void)
    registered = wanted
    disposeTools = () => {
      for (const dispose of disposers.splice(0)) dispose()
      registered = ''
    }
  }
  ctx.inject(['tools'], (scope) => {
    toolsCtx = scope
    syncTools()
    scope.effect(() => () => {
      disposeTools()
      disposeTools = () => {}
      toolsCtx = undefined
    }, 'dsh-genui: model tools')
  })
  ctx.on('loader/volatile-update' as never, (() => {
    config = snapshotGenuiConfig(input)
    syncTools()
  }) as never)

  ctx.inject(['skills'], (skillCtx) => {
    skillCtx.skills.registerProvider(() => bundledSkillProvider(() => config))
  })

  // webServer.register returns a raw disposer, so an explicit effect binds the
  // route to the dependency fiber instead of leaving it in the host route table.
  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.reflect.get('webServer') as { register(route: unknown): () => void }
    webCtx.effect(
      () => webServer.register({ kind: 'prefix', path: ASSET_ROUTE_PATH, handler: serveGenuiAsset }),
      'dsh-genui: asset route',
    )
  })
}
