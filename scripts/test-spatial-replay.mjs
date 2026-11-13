import assert from 'node:assert/strict'
import { execFile, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sitemapPaths } from './spatial/sitemap-routes.mjs'

const checkedInReceipt = JSON.parse(readFileSync(new URL('../design/spatial-baseline.json', import.meta.url), 'utf8'))
assert.equal(checkedInReceipt.version, 2, 'the checked-in spatial baseline must be a v2 receipt')

const tmp = mkdtempSync(join(tmpdir(), 'watch-spatial-replay-'))
const checker = fileURLToPath(new URL('./spatial/spatial-check.mjs', import.meta.url))
const artifact = join(tmp, 'measurements.json')
const receipt = join(tmp, 'baseline.json')
const cell = (route, w) => ({
  route, w, findings: [], hierarchy: { h1Count: 1 }, chars: 30,
  chrome: { top: 100, bottom: 0 }, firstAction: { y: 160, sel: 'button' },
})
const cells = ['/', '/about/'].flatMap((route) => [390, 1024].map((w) => cell(route, w)))
const run = (measurements, ...args) => {
  writeFileSync(artifact, JSON.stringify({ measurements }))
  const result = spawnSync(process.execPath, [checker, '--replay', artifact, '--baseline', receipt, ...args],
    { encoding: 'utf8' })
  if (result.error) throw result.error
  return { code: result.status, output: result.stdout + result.stderr }
}
const exec = promisify(execFile)
const html = '<link rel="stylesheet" href="/site.css">'
let css = 'body{color:black}'
let sitemapStatus = 200
const server = createServer((req, res) => {
  if (req.url === '/site.css') {
    res.setHeader('Content-Type', 'text/css')
    return res.end(css)
  }
  if (req.url === '/sitemap.xml') {
    res.statusCode = sitemapStatus
    return res.end(`<urlset><loc>http://${req.headers.host}/about</loc></urlset>`)
  }
  return res.end(html)
})
try {
  const baseline = {
    widths: [390, 1024], measuredWidths: [390, 1024],
    routes: Object.fromEntries(['/', '/about/'].map((route) => [route,
      Object.fromEntries(cells.filter((row) => row.route === route).map((row) => [row.w, row])),
    ])),
  }
  const canonicalSitemap = '<loc>https://watch.nonarkara.org/register</loc><loc>https://other.invalid/wrong</loc>'
  assert.deepEqual(sitemapPaths(canonicalSitemap, 'https://f79a13b0.watch-1de.pages.dev'), ['/register'])
  assert.deepEqual(sitemapPaths(canonicalSitemap, 'https://unrelated.example'), [])
  writeFileSync(receipt, JSON.stringify(baseline))
  const pass = run(cells)
  assert.equal(pass.code, 0, pass.output)
  assert.match(pass.output, /live routes and stylesheets were not checked/)
  const duplicate = run([...cells.slice(0, 3), cells[0]])
  assert.equal(duplicate.code, 1)
  assert.match(duplicate.output, /Missing 1 measurement/)
  assert.match(duplicate.output, /Measured twice/)
  const failed = run([...cells.slice(0, 3), { route: '/about/', w: 1024, error: 'empty app shell' }])
  assert.equal(failed.code, 1)
  assert.match(failed.output, /empty app shell/)
  assert.equal(run(cells, '--update').code, 1, 'replay must not write a new baseline')
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const fingerprint = createHash('sha256').update(html).update(css).digest('hex')
  const routes = ['/', '/about/'], widths = [390, 1024]
  const plan = createHash('sha256').update(JSON.stringify({
    base, routes, advertisedRoutes: routes, widths, fingerprint, baseline,
  })).digest('hex')
  const partDir = mkdtempSync(join(tmp, 'parts-'))
  const writeShard = (index, measurements, name = `${index}.json`) => {
    writeFileSync(join(partDir, name), JSON.stringify({ plan, shard: { index, count: 2 }, measurements }))
  }
  const assemble = async () => {
    try {
      const { stdout } = await exec(process.execPath, [checker, '--base', base, '--assemble', partDir, '--baseline', receipt])
      return { code: 0, output: stdout }
    } catch (error) {
      return { code: error.code, output: error.stdout + error.stderr }
    }
  }
  writeShard(1, cells.slice(0, 2))
  assert.match((await assemble()).output, /expected 2 shards, got 1/)
  writeShard(2, [cells[2], cells[2]])
  assert.match((await assemble()).output, /Measured twice/)
  writeShard(2, [cells[2], { ...cells[3], error: 'broken route' }])
  assert.match((await assemble()).output, /broken route/)
  writeShard(2, cells.slice(2))
  const assembled = await assemble()
  assert.equal(assembled.code, 0, assembled.output)
  sitemapStatus = 503
  assert.match((await assemble()).output, /cannot discover deployed sitemap routes: HTTP 503/)
  sitemapStatus = 200
  css = 'body{color:red}'
  assert.match((await assemble()).output, /incompatible shard/)
  console.log('✓ spatial replay and sharded gate require full unique coverage, preserve errors, and reject a changed deployment')
} finally {
  server.close()
  rmSync(tmp, { recursive: true, force: true })
}
