#!/usr/bin/env node
/**
 * dsh-genui 真机 e2e：真实 dsh web + 插件 → 模型输出 dsh-ui fence → 浏览器渲染
 * → 点击 action 按钮 → 模型收到 [genui-action] 并响应更新。全程走真实链路，
 * 不 mock 任何环节。
 *
 * 防假通过：点击后的"响应"只认「出现新的 assistant-step key（且新节点不再
 * streaming）或面板/块数由新操作驱动」——按钮的本地 chip 文案变化不算响应。
 * 失败日志可读：web 的 stdout/stderr 真写进 dsh-web.log，失败时输出日志尾部，
 * 截图保留到当前目录；清理在 finally 中完成，只杀自己起的进程组。
 *
 * 用法：
 *   node scripts/e2e.mjs [--port 3088] [--keep] [--install link|npm|tarball]
 *                        [--tarball <路径> --tarball-sha256 <sha>] [--smoke] [--sidechat | --map]
 *
 *   --install link    （默认）装当前工作区，测的就是当前代码
 *   --install npm     从公开 npm 包安装
 *   --install tarball 必须给 --tarball 绝对路径与 --tarball-sha256（防假安装）
 *   --smoke           不要求模型 Key：安装 → 启动 → 首页/client.js 200 →
 *                     无页面异常 → 插件 boot → Diff/Code/JSON 渲染与复制；
 *                     rc.3 / alpha.2 Gallery 使用官方本地 replay 验证真实会话动作，不访问真实模型。
 *   --sidechat        显式启用双插件验收；仅允许 --smoke --install tarball，
 *                     会构建固定提交的 Better Sidebar，不改变原有 smoke 模式。
 *   --map             仅现有 Linux CI：sandboxed Chrome + 真实 Map WebGL/worker、
 *                     packed embed、离线 HTML；rc.3 / alpha.2 官方 replay 验证一次显式提交。
 * 退出码 0 = PASS，1 = FAIL。
 */

import { spawn, spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { createWriteStream, rmSync } from 'node:fs'
import { mkdtemp, mkdir, copyFile, rm, writeFile, appendFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { createServer } from 'node:net'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createGallerySpec, startGalleryImageServer } from './gallery-browser-checks.mjs'
import { runGalleryFixedContexts } from './gallery-fixed-contexts.mjs'
import { gallerySmokeEnvironment, prepareGalleryConversation } from './e2e-gallery-host.mjs'
import { runSidechatCI, validateSidechatMode } from './sidechat-acceptance/ci.mjs'
import { resolveExactHost } from './sidechat-acceptance/scripts/sidechat-host-contract.mjs'
import { prepareMapConversation } from './e2e-map-host.mjs'
import { createMapSpec, mapBrowserLaunchOptions, validateMapMode, safeMapError } from './map-acceptance/contract.mjs'
import { runMapAcceptance } from './map-acceptance/run.mjs'

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DSH_ROOT = process.env.DSH_ROOT ?? resolve(process.env.HOME ?? '', '.dsh/source/current')
// 精确宿主二进制：必须是 DSH_ROOT 内构建出的绝对路径；默认不从 PATH 找 dsh。
const DSH_BIN = process.env.DSH_BIN ?? join(DSH_ROOT, 'apps/cli/lib/bin.js')
if (!resolve(DSH_BIN).startsWith('/')) fail('DSH_BIN 必须是绝对路径')
if (!existsSync(DSH_BIN)) fail(`DSH_BIN 不存在: ${DSH_BIN}（在 DSH_ROOT 内先 pnpm run build）`)
const HOST_LAYOUT = process.env.DSH_HOST_LAYOUT ?? 'source'
assert.ok(['source', 'registry'].includes(HOST_LAYOUT), 'Explicit source or registry host layout required')
if (HOST_LAYOUT === 'registry') assert.ok(process.env.DSH_HOST_VERSION, 'Published host requires an exact DSH_HOST_VERSION')
const publishedHost = HOST_LAYOUT === 'registry'
  ? await resolveExactHost({ dshRoot: DSH_ROOT, dshBin: DSH_BIN, hostLayout: HOST_LAYOUT, expectedVersion: process.env.DSH_HOST_VERSION })
  : undefined
const arg = (name) => {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}
function findDshWebUrl(output) {
  return output.match(/dsh web: (http:\/\/127\.0\.0\.1:\d+(?:\/\?token=[A-Za-z0-9_-]+)?)/u)?.[1]
}
const PORT = Number(arg('--port') ?? 3088)
const KEEP = process.argv.includes('--keep')
const SMOKE = process.argv.includes('--smoke')
const SIDECHAT = process.argv.includes('--sidechat')
const MAP = process.argv.includes('--map')
const INSTALL = arg('--install') ?? 'link'
const TARBALL = arg('--tarball')
const TARBALL_SHA = arg('--tarball-sha256')
const PROMPT = '请严格照抄以下三行 Markdown，不要增加或删除任何字符。第一行只有围栏标签，JSON 从第二行开始：\n```dsh-ui\n{"items":[{"type":"text","content":"兼容验收"},{"type":"radio","label":"模式","group":"mode","options":["甲","乙"]},{"type":"checkbox","label":"启用","group":"flags"},{"type":"input","id":"note","label":"备注"},{"type":"button","label":"发送动作","action":"compat_ping"}]}\n```'

const fail = (msg) => { console.error(`✗ ${MAP ? safeMapError(msg) : msg}`); process.exit(1) }
const log = (msg) => console.log(`· ${msg}`)

// ── 预检：参数、端口、工具 ─────────────────────────────────────────────────
if (!['link', 'npm', 'tarball'].includes(INSTALL)) fail(`--install 仅允许 link | npm | tarball，收到 "${INSTALL}"`)
validateSidechatMode({ sidechat: SIDECHAT, smoke: SMOKE, install: INSTALL })
validateMapMode({ map: MAP, smoke: SMOKE, sidechat: SIDECHAT, install: INSTALL, env: process.env, uid: process.getuid?.() })
if (INSTALL === 'tarball') {
  if (!TARBALL || !TARBALL_SHA) fail('tarball 模式必须提供 --tarball <绝对路径> 与 --tarball-sha256 <sha256>')
  if (!resolve(TARBALL).startsWith('/')) fail('--tarball 必须是绝对路径')
  if (!existsSync(TARBALL)) fail(`tarball 不存在: ${TARBALL}`)
  const actual = createHash('sha256').update(await (await import('node:fs/promises')).readFile(TARBALL)).digest('hex')
  if (actual !== TARBALL_SHA.toLowerCase()) fail(`tarball SHA256 不匹配：期望 ${TARBALL_SHA}，实际 ${actual}`)
  log(`✓ tarball SHA256 匹配（${actual.slice(0, 12)}…）`)
}
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) fail(`非法端口: ${PORT}`)
await new Promise((res) => {
  const probe = createServer()
  probe.once('error', () => { fail(`端口 ${PORT} 已被占用，请用 --port 换一个`) })
  probe.listen(PORT, '127.0.0.1', () => probe.close(res))
})
if (!SMOKE && !process.env.DEEPSEEK_API_KEY) fail('缺少 DEEPSEEK_API_KEY（模型需要真实 key；--smoke 模式不需要）')
{
  const r = spawnSync('sh', ['-c', 'command -v pnpm'], { encoding: 'utf8' })
  if (r.status !== 0) fail('未找到 pnpm，请先安装并确保在 PATH 上')
}
log(`DSH_BIN: ${DSH_BIN}`)
log(`pnpm: ${spawnSync('pnpm', ['--version'], { encoding: 'utf8' }).stdout.trim()}`)

// ── 临时环境 ──────────────────────────────────────────────────────────────
const DSH_HOME = await mkdtemp(join(tmpdir(), 'dsh-genui-e2e-host-'))
const env = SMOKE
  ? { ...gallerySmokeEnvironment(process.env, DSH_HOME), HOME: join(DSH_HOME, 'tool-home') }
  : { ...process.env, DSH_HOME }
const smokeCwd = join(DSH_HOME, 'smoke-workspace')
const webLog = join(DSH_HOME, 'dsh-web.log')
const artifactsDir = process.cwd()
let webChild = null
let browser = null
let galleryAssets = null
let galleryConversation = null

const killWeb = () => {
  if (webChild === null) return
  // 只杀自己启动的进程组（detached spawn 的负 pid），绝不 broad pkill
  try { process.kill(-webChild.pid, 'SIGTERM') } catch { /* already gone */ }
  try { process.kill(webChild.pid, 'SIGTERM') } catch { /* already gone */ }
  webChild = null
}

// fail() 会直接退出；exit 钩子保证失败路径也只清理本脚本创建的临时环境。
process.on('exit', () => {
  killWeb()
  if (!KEEP) rmSync(DSH_HOME, { recursive: true, force: true })
})

const cleanup = async () => {
  const errors = []
  for (const [name, close] of [
    ['browser', async () => { const owned = browser; browser = null; await owned?.close() }],
    ['gallery images', async () => { const owned = galleryAssets; galleryAssets = null; await owned?.close() }],
  ]) {
    let timer
    try {
      await Promise.race([close(), new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Closing ${name} timed out`)), 8000)
      })])
    } catch (error) { errors.push(error) }
    finally { clearTimeout(timer) }
  }
  killWeb()
  if (!KEEP) await rm(DSH_HOME, { recursive: true, force: true })
  else log(`保留临时环境: ${DSH_HOME}（日志: ${webLog}）`)
  if (errors.length) throw new AggregateError(errors, 'Owned smoke resources did not close normally')
}

const logTail = async (n = 30) => {
  try {
    const content = await (await import('node:fs/promises')).readFile(webLog, 'utf8')
    const lines = content.split('\n').filter(Boolean).slice(-n)
    console.error('── dsh-web.log 尾部 ──')
    console.error(MAP ? safeMapError(lines.join('\n') || '(空)') : lines.join('\n') || '(空)')
  } catch { /* no log yet */ }
}

try {
  // The official launcher reads cwd/.env. A no-key run must not load a real
  // project environment, even after inherited credential variables are removed.
  if (SMOKE) {
    await mkdir(smokeCwd, { recursive: true })
    await mkdir(env.HOME, { recursive: true })
  }
  const installCwd = SMOKE ? smokeCwd : undefined
  // ── 安装插件 ────────────────────────────────────────────────────────────
  if (INSTALL === 'npm') {
    log('安装插件（npm 公开包）...')
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', '@changfenhuang/dsh-genui'], { env, cwd: installCwd, stdio: 'inherit' })
    if (r.status !== 0) fail('npm 安装失败（见上方输出）')
  } else if (INSTALL === 'tarball') {
    log(`安装插件（tarball ${TARBALL}）...`)
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', TARBALL], { env, cwd: installCwd, stdio: 'inherit' })
    if (r.status !== 0) fail('tarball 安装失败（见上方输出）')
  } else {
    log('安装插件（link 当前工作区）...')
    const r = spawnSync(DSH_BIN, ['plugin', '--profile', 'web', 'add', `link:${REPO_ROOT}`], { env, cwd: installCwd, stdio: 'inherit' })
    if (r.status !== 0) fail('link 安装失败（见上方输出）')
  }

  if (MAP) {
    galleryConversation = await prepareMapConversation({ dshRoot: DSH_ROOT, dshHome: DSH_HOME, spec: createMapSpec(), publishedHost })
  } else if (SMOKE) {
    galleryAssets = await startGalleryImageServer()
    galleryConversation = await prepareGalleryConversation({
      dshRoot: DSH_ROOT, dshHome: DSH_HOME, spec: createGallerySpec(galleryAssets.origin), publishedHost,
    })
    if (galleryConversation === null) {
      await galleryAssets.close()
      galleryAssets = null
    }
  }

  // ── 启动 dsh web（stdout/stderr 真写进 webLog）──────────────────────────
  log('预置工作区注册表...')
  const workspaceId = randomUUID()
  const now = new Date().toISOString()
  const workspaceReg = {
    unit: { name: 'workspace', version: 2 },
    global: { initialized: true, workspaceIds: [workspaceId], archivedSessionIds: [] },
    tables: { workspaces: { [workspaceId]: {
      path: SMOKE ? smokeCwd : REPO_ROOT, title: 'dsh-genui-e2e', sessionIds: [], createdAt: now, updatedAt: now,
    } } },
  }
  await mkdir(join(DSH_HOME, 'storages'), { recursive: true })
  await writeFile(join(DSH_HOME, 'storages/workspace.json'), JSON.stringify(workspaceReg, null, 2))

  const hostSettings = join(homedir(), '.dsh/settings.yaml')
  if (!SMOKE && existsSync(hostSettings)) {
    await copyFile(hostSettings, join(DSH_HOME, 'settings.yaml'))
    log('已复制模型配置 settings.yaml')
  } else if (!SMOKE) {
    log('警告: 未找到 ~/.dsh/settings.yaml，模型可能不可用')
  }

  log(`启动 dsh web (port ${PORT}, DSH_HOME=${DSH_HOME})...`)
  const logStream = createWriteStream(webLog, { flags: 'a' })
  // Launcher --patch flags precede web-app flags; both are official CLI paths.
  webChild = spawn(DSH_BIN, ['web', ...(galleryConversation?.webArgs ?? []), '--no-open', '--port', String(PORT)], {
    env, cwd: SMOKE ? galleryConversation?.cwd ?? smokeCwd : undefined,
    detached: true, stdio: ['ignore', 'pipe', 'pipe'],
  })
  let webOutput = ''
  const captureWebOutput = (chunk) => {
    logStream.write(chunk)
    webOutput += chunk.toString()
  }
  webChild.stdout.on('data', captureWebOutput)
  webChild.stderr.on('data', captureWebOutput)
  let readyUrl
  for (let i = 0; i < 120; i++) {
    if (webChild.exitCode !== null) break
    readyUrl = findDshWebUrl(webOutput)
    if (readyUrl !== undefined) break
    await new Promise(r => setTimeout(r, 1000))
  }
  if (readyUrl === undefined) {
    await logTail()
    fail(`dsh web 120s 内未就绪（日志: ${webLog}）`)
  }
  log('dsh web 就绪')

  // ── 浏览器链路 ──────────────────────────────────────────────────────────
  const { chromium } = publishedHost === undefined
    ? await import(pathToFileURL(join(DSH_ROOT, 'apps/web/node_modules/playwright/index.mjs')).href)
    : createRequire(join(publishedHost.root, 'package.json'))('playwright')
  browser = await chromium.launch(MAP ? mapBrowserLaunchOptions(process.env.E2E_CHROMIUM) : {
    ...(process.env.E2E_CHROMIUM ? { executablePath: process.env.E2E_CHROMIUM } : { channel: 'chrome' }),
    headless: true,
    args: ['--password-store=basic', '--use-mock-keychain'],
  })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 }, locale: 'zh-CN', hasTouch: false, ...(MAP ? {} : { permissions: ['clipboard-read', 'clipboard-write'] }) })
  const pageErrors = []
  const pageMessages = []
  page.on('console', message => pageMessages.push(message.text()))
  page.on('pageerror', e => pageErrors.push(String(e)))
  await page.goto(readyUrl, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForTimeout(5000)

  // 0.1.2 起使用启动图公告的不可变组合 URL；更早的受支持宿主使用裸插件地址。
  const boot = await page.evaluate(() => {
    const boot = window.__DSH_BOOT__
    if (boot === null || typeof boot !== 'object' || !Array.isArray(boot.entries)) return undefined
    return { entries: boot.entries.length, clientUrl: boot.entries.find(entry => entry.id === '@changfenhuang/dsh-genui')?.url }
  })
  if (boot?.entries === 0) {
    await page.screenshot({ path: join(artifactsDir, 'e2e-fail-empty-host-boot.png') })
    fail('dsh 宿主启动图为空（连内置浏览器插件都未注册）')
  }
  const clientUrl = boot?.clientUrl ?? '/plugins/@changfenhuang/dsh-genui/client.js'
  const clientRes = await fetch(new URL(clientUrl, readyUrl))
  if (!clientRes.ok) {
    await page.screenshot({ path: join(artifactsDir, 'e2e-fail-client404.png') })
    await logTail()
    fail(`GenUI bundle 返回 ${clientRes.status}`)
  }
  log(`✓ GenUI bundle ${clientRes.status}`)

  if (pageErrors.length > 0) {
    await page.screenshot({ path: join(artifactsDir, 'e2e-fail-pageerror.png') })
    fail(`页面异常: ${pageErrors.slice(0, 3).join(' | ')}`)
  }
  if (!pageMessages.some(message => message.includes('[genui] client active; fence-channel='))) {
    fail('GenUI bundle 已下载，但客户端入口未激活')
  }

  if (SMOKE) {
    // 空 profile 首次启动的引导：内测声明 → 凭据弹窗。DSH 0.2.0 系列凭据弹窗
    // 提供「稍后配置」；DSH 0.2.1 系列只留关闭（Esc/×），且关闭只作用于当前
    // 页面会话（刷新会重现）。遮罩可能在宿主重渲染时重新挂回，所以在后续每次
    // 真实指针交互前幂等地再关一次。scratch 实例,不是产品行为断言（同 e2e-visual.mts）。
    const createDismissCredentialsOverlay = activePage => async () => {
      const later = activePage.getByRole('button', { name: '稍后配置', exact: true })
      if (await later.count() > 0) {
        await later.first().click({ timeout: 8000 }).catch(() => {})
        return
      }
      const login = activePage.getByRole('button', { name: '登录', exact: true })
      if (await login.isVisible().catch(() => false)) {
        await activePage.keyboard.press('Escape')
        await activePage.waitForTimeout(300)
      }
    }
    const dismissCredentialsOverlay = createDismissCredentialsOverlay(page)
    // Fresh keyless profiles follow the host's normal onboarding.
    await page.getByRole('button', { name: '继续', exact: true }).click()
    await page.waitForTimeout(500)
    await dismissCredentialsOverlay()
    if (MAP) {
      await runMapAcceptance({ browser, page, readyUrl, repoRoot: REPO_ROOT, tarball: TARBALL,
        conversation: galleryConversation, dismiss: dismissCredentialsOverlay })
      await cleanup()
      console.log('PASS Map browser acceptance (sandboxed software GPU; synthetic local replay only)')
      process.exit(0)
    }
    await runGalleryFixedContexts({ browser, page, readyUrl, artifactsDir, galleryConversation, galleryAssets,
      createDismissCredentialsOverlay, log })
    await galleryConversation?.verifyComputed({ page, browser, artifactsDir })
    // DOM-injected fence smoke fixtures are retired: current DSH owns fence
    // discovery. The gallery above exercises the installed host path; the
    // deterministic native HOC/streaming tests live in check-native-fence-browser.mjs.
    log('smoke 模式：安装、激活和真实会话 Gallery 渲染通过')
    try {
      if (SIDECHAT) {
        const sidechat = await runSidechatCI({ browser, dshRoot: DSH_ROOT, dshBin: DSH_BIN,
          genuiTarball: TARBALL, genuiTarballSha256: TARBALL_SHA,
          artifactDir: join(REPO_ROOT, '.e2e-artifacts/sidechat') })
        log(`dual-plugin sidechat: ${sidechat.status} (${sidechat.hostVersion})`)
      }
    } finally { await browser.close() }
    await cleanup()
    console.log('PASS smoke e2e（不消耗模型额度）')
    process.exit(0)
  }

  // 新会话（工作区已预置）；点击失败不算容错——直接失败留证据
  const newSession = page.getByText('新会话', { exact: false }).first()
  await newSession.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {})
  const clickedNew = await newSession.click().then(() => true).catch(() => false)
  if (!clickedNew) {
    await page.screenshot({ path: join(artifactsDir, 'e2e-fail-newsession.png') })
    await logTail()
    fail('未找到可点击的「新会话」入口')
  }
  await page.getByText('dsh-genui-e2e', { exact: true }).first().click()

  // 使用宿主公开标记定位可编辑输入区，等待会话初始化完成。
  await page.waitForFunction(() => {
    const input = document.querySelector('[data-composer-input]')
    return input instanceof HTMLElement && input.isContentEditable && !input.closest('[inert]')
  }, undefined, { timeout: 30000 })
  const composer = page.locator('[data-composer-input]')
  await composer.fill(PROMPT)
  await composer.press('Enter')
  log('prompt 已发送，等待模型输出 dsh-ui fence...')

  const genuiCount = () => page.evaluate(() => document.querySelectorAll('[data-genui]').length)
  /** 最后一个 assistant-step 的稳定 key（流式结束即稳定；出现新 key = 新回复） */
  const lastStepKey = () => page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-chat-flow-kind="assistant-step"]')
    return nodes.length ? nodes[nodes.length - 1].getAttribute('data-chat-flow-key') : null
  })
  const stepSettled = async () => page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-chat-flow-kind="assistant-step"]')
    if (nodes.length === 0) return false
    return nodes[nodes.length - 1].querySelector('[data-streaming]') === null
  })

  // 等待第一个 fence 渲染
  let blocks = 0
  for (let i = 0; i < 180; i++) {
    blocks = await genuiCount()
    if (blocks > 0) break
    await new Promise(r => setTimeout(r, 1000))
  }
  if (blocks === 0) {
    console.error('最后一条模型回复:', ((await page.locator('[data-chat-flow-kind="assistant-step"]').last().textContent().catch(() => null)) ?? '无').slice(-2000))
    console.error('dsh-ui 代码块数量:', await page.locator('.md-code-block').count())
    await page.screenshot({ path: join(artifactsDir, 'e2e-fail-timeout.png') })
    await logTail()
    fail(`模型 180s 内未输出可渲染的 dsh-ui fence（pageerrors: ${pageErrors.slice(0, 3).join(' | ') || '无'}）`)
  }
  log(`✓ fence 渲染成功（${blocks} 个 data-genui 块）`)

  const radio = page.getByRole('radiogroup', { name: '模式' }).getByRole('radio', { name: '乙' })
  const checkbox = page.getByRole('checkbox', { name: '启用' })
  const input = page.getByRole('textbox', { name: '备注' })
  await radio.check()
  await checkbox.check()
  await input.fill('保留状态')
  await page.waitForTimeout(500)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.locator('[data-genui]').first().waitFor({ state: 'visible' })
  assert.equal(await radio.isChecked(), true, 'radio 选择在重新渲染后保持')
  assert.equal(await checkbox.isChecked(), true, 'checkbox 选择在重新渲染后保持')
  assert.equal(await input.inputValue(), '保留状态', 'input 内容在重新渲染后保持')
  log('✓ radio、checkbox、input 状态在重新渲染后保持')

  // 点击围栏声明的 action 按钮
  const beforeKey = await lastStepKey()
  await page.getByRole('button', { name: '发送动作' }).click()
  log('已点击 action 按钮，等待模型响应...')
  await page.locator('[data-chat-flow-kind="user"], [data-chat-flow-kind="steering"]')
    .filter({ hasText: '[genui-action]' }).first().waitFor({ state: 'attached', timeout: 30000 })
  log('✓ [genui-action] 已进入宿主会话消息')

  // 响应判定：新的 assistant-step key 出现且新节点结束 streaming；
  // 或 genui 块数变化（面板/新 fence）。按钮 chip 的本地文本变化不算。
  let responded = false
  for (let i = 0; i < 180; i++) {
    const key = await lastStepKey()
    const b2 = await genuiCount()
    if (b2 !== blocks) { responded = true; blocks = b2; break }
    if (key !== null && key !== beforeKey) {
      const settled = await stepSettled()
      if (settled) { responded = true; break }
    }
    await new Promise(r => setTimeout(r, 1000))
  }
  if (!responded) {
    await page.screenshot({ path: join(artifactsDir, 'e2e-fail-action-timeout.png') })
    await logTail()
    fail('点击 action 后 180s 内无真实模型响应（事件循环未闭环；本地 chip 变化不算）')
  }
  await page.waitForTimeout(2500)
  await page.screenshot({ path: join(artifactsDir, 'e2e-final.png') })
  log(`✓ 事件循环闭环（块数 ${blocks}，截图 e2e-final.png）`)
  console.log('PASS 真机 e2e 通过：安装 → 渲染 → action 回传 → 真实模型响应')
  await browser.close()
  await cleanup()
  process.exit(0)
} catch (e) {
  if (MAP) {
    const out = join(REPO_ROOT, '.e2e-artifacts/map')
    await mkdir(out, { recursive: true })
    await writeFile(join(out, 'map-runner-error.json'), JSON.stringify({ passed: false, error: safeMapError(e),
      browserStarted: browser !== null, sandboxRequested: true, revision: process.env.GITHUB_SHA ?? null }, null, 2) + '\n')
  }
  console.error('✗ e2e 异常:', MAP ? safeMapError(e) : e)
  await logTail()
  try { await cleanup() } catch (error) {
    if (!MAP) throw error
    console.error('Map cleanup failed:', safeMapError(error))
  }
  process.exit(1)
}
