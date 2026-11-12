import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

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
try {
  writeFileSync(receipt, JSON.stringify({
    widths: [390, 1024], measuredWidths: [390, 1024],
    routes: Object.fromEntries(['/', '/about/'].map((route) => [route,
      Object.fromEntries(cells.filter((row) => row.route === route).map((row) => [row.w, row])),
    ])),
  }))
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
  console.log('✓ spatial replay requires every unique measurement and preserves render failures')
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
