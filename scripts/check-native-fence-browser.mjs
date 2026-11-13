/** Real rc.3 HOC dispatch and Chromium; no running DSH or provider credentials. */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const renderer = require.resolve('@deepseek-ai/dsh-client-ui-renderer/package.json').replace(/package\.json$/, 'lib/client.js')
const { chromium } = await import('../.e2e-artifacts/pw/node_modules/playwright-core/index.mjs')
const out = resolve(root, '.e2e-artifacts/native-fence')
await mkdir(out, { recursive: true })
const server = await createServer({ root, configFile: false,
  plugins: [{ name: 'published-host-renderer', configureServer(instance) {
    instance.middlewares.use('/__host-renderer.js', async (_request, response) => {
      response.setHeader('content-type', 'application/javascript'); response.end(await readFile(renderer))
    })
  } }],
  resolve: { dedupe: ['react', 'react-dom'] },
  optimizeDeps: { entries: ['tests/browser/native-fence.html'] },
  server: { host: '127.0.0.1', port: 0, watch: { ignored: ['**/.e2e-artifacts/**'] } },
})
let browser
try {
  await server.listen()
  const address = server.httpServer.address()
  assert.ok(address && typeof address !== 'string')
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${address.port}/tests/browser/native-fence.html`)
  await page.getByRole('textbox').waitFor()
  await page.getByRole('textbox').fill('Keep this while streaming')
  await page.evaluate(() => window.fixture.set({ streaming: false }))
  assert.equal(await page.getByRole('textbox').inputValue(), 'Keep this while streaming')
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  const action = await page.evaluate(() => window.fixture.actions[0])
  assert.equal(action[0], 'browser-session')
  assert.equal(action[1], 'continue')
  assert.equal(action[2].fields.choice, 'Keep this while streaming')
  await page.screenshot({ path: resolve(out, 'native-form.png'), fullPage: true })
  await page.evaluate(() => window.fixture.set({ lang: 'json' }))
  await page.locator('[data-code-block-content]').waitFor()
  assert.equal(await page.locator('[data-genui]').count(), 0)
  await page.evaluate(() => window.fixture.set({ lang: 'dsh-ui', code: 'not a GenUI document' }))
  await page.getByRole('alert').waitFor()
  assert.ok(await page.locator('[data-code-block-content]').isVisible())
  await page.evaluate(() => window.fixture.set({ code: JSON.stringify({ panel: true, items: [{ type: 'text', content: 'Panel from native slot' }] }) }))
  await page.waitForFunction(() => window.fixture.panel()?.items?.length === 1)
  await page.evaluate(() => window.fixture.set({ lang: 'svg', code: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><circle cx="50" cy="30" r="20" fill="teal"/></svg>' }))
  await page.locator('[data-genui-svg-fence]').waitFor()
  await page.evaluate(() => window.fixture.set({ lang: 'dsh-html', code: '<h2>Native HTML</h2>' }))
  await page.locator('[data-genui-html] iframe').waitFor()
  await page.evaluate(() => window.fixture.unload())
  await page.locator('[data-code-block-content]').waitFor()
  assert.equal(await page.locator('[data-genui-html]').count(), 0)
  assert.deepEqual(errors, [])
  await writeFile(resolve(out, 'results.json'), JSON.stringify({ host: '0.2.2-rc.3', passed: [
    'real host HOC dispatch', 'streaming input retention', 'session action routing', 'ordinary JSON fallback',
    'invalid fence diagnostic', 'settled panel publication', 'SVG', 'HTML iframe', 'plugin unload',
  ] }, null, 2) + '\n')
  console.log('PASS: 9 native fence checks in Chromium with the published DSH rc.3 renderer')
} finally { await browser?.close(); await server.close() }
