// Live attention pipeline: collector, Worker cron, Pages Function, and the
// frontend's live-vs-build chooser. No network: every fetch is mocked.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { collectAttention, nextHealth, healthStatus, rankScore, MAX_ROWS } from '../worker/live/attention.mjs'
import worker, { runCollector } from '../worker/live/index.mjs'
import { handleLive } from '../functions/live/[[path]].js'
import { pickFresher, isUsableSnapshot, sourceLine } from '../src/lib/live-trends.ts'

const watchlist = JSON.parse(readFileSync(new URL('../data/shared/trend_watchlist.json', import.meta.url), 'utf8'))
const cards = new Set(JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8')).cards.map((c) => c.id))
const NOW = new Date('2026-10-18T06:40:00Z')

function wikiResponse(views) {
  return { ok: true, status: 200, json: async () => ({ items: views.map((v, i) => ({ timestamp: `202610${String(10 + i).padStart(2, '0')}00`, views: v })) }) }
}
function mockFetch({ fail = new Set(), status = 500 } = {}) {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, ua: init?.headers?.['User-Agent'] })
    const title = decodeURIComponent(url.split('/user/')[1].split('/daily/')[0])
    if (fail.has(title) || fail.has('*')) return { ok: false, status, json: async () => ({}) }
    return wikiResponse([100, 110, 120, 130, 140, 150, 160, 200])
  }
  fn.calls = calls
  return fn
}
function memoryKV(seed = {}) {
  const m = new Map(Object.entries(seed).map(([k, v]) => [k, JSON.stringify(v)]))
  return {
    m,
    writes: 0,
    async get(k, t) { const v = m.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v },
    async put(k, v) { this.writes++; m.set(k, v) },
  }
}

// 1. Collector: every row maps to a live card, Trends is never invented,
//    every request is identified, ranking matches the build-time formula.
{
  const f = mockFetch()
  const { snapshot, signalRows, total } = await collectAttention({ watchlist, fetchImpl: f, now: NOW })
  assert.equal(total, Math.min(watchlist.items.length, MAX_ROWS))
  assert.equal(signalRows, total)
  assert.equal(f.calls.length, total, 'one Wikimedia request per row, nothing else')
  assert.ok(f.calls.every((c) => c.url.startsWith('https://wikimedia.org/api/rest_v1/') && /TimePopBot/.test(c.ua)))
  assert.ok(f.calls.length <= 50, 'stays inside the Workers Free 50-subrequest cap')
  for (const r of snapshot.trending) {
    assert.ok(cards.has(r.card_id), `row ${r.id} must map to a live card`)
    assert.equal(r.trends.interest, null)
    assert.equal(r.trends.reason, 'not_connected')
    assert.equal(r.score, Math.round(rankScore(r) * 100) / 100)
  }
  assert.equal(snapshot.sources.find((s) => s.id === 'google_trends').status, 'not_connected')
  assert.equal(snapshot.sources.find((s) => s.id === 'wikipedia_pageviews').status, 'ok')
  assert.equal(snapshot.as_of, '2026-10-18')
  assert.equal(snapshot.data_through, '20261017', 'data_through is the newest day the counts cover')
  assert.deepEqual(snapshot.trending.map((r) => r.rank), snapshot.trending.map((_, i) => i + 1))
}

// 2. One article failing degrades that row with a reason, not a number.
{
  const bad = watchlist.items[0].wikipedia
  const { snapshot } = await collectAttention({ watchlist, fetchImpl: mockFetch({ fail: new Set([bad]) }), now: NOW })
  const row = snapshot.trending.find((r) => r.wikipedia_title === bad)
  assert.equal(row.wikipedia.last_views, null)
  assert.equal(row.wikipedia.reason, 'http_500')
  assert.equal(snapshot.sources.find((s) => s.id === 'wikipedia_pageviews').status, 'partial')
}

// 3. Worker: a good run writes snapshot + health (2 KV writes); a bad run
//    keeps the previous snapshot and counts the failure.
{
  const kv = memoryKV()
  const ok = await runCollector({ WATCH_LIVE: kv }, { fetchImpl: mockFetch(), now: NOW })
  assert.equal(ok.ok, true)
  assert.equal(kv.writes, 2)
  const good = kv.m.get('attention:latest')
  const later = new Date('2026-10-19T06:40:00Z')
  const bad = await runCollector({ WATCH_LIVE: kv }, { fetchImpl: mockFetch({ fail: new Set(['*']), status: 429 }), now: later })
  assert.equal(bad.ok, false)
  assert.equal(kv.m.get('attention:latest'), good, 'a failed run must not overwrite the last good snapshot')
  const h = JSON.parse(kv.m.get('health'))
  assert.equal(h.consecutive_failures, 1)
  assert.equal(h.last_ok, NOW.toISOString())
  assert.match(h.last_error, /kept the previous snapshot/)
  await runCollector({ WATCH_LIVE: kv }, { fetchImpl: async () => { throw new Error('dns') }, now: later })
  assert.equal(JSON.parse(kv.m.get('health')).consecutive_failures, 2)
}

// 4. Health: ok, failing after 2 bad runs, stale after 36 h, not_connected.
{
  const snap = { built_at: NOW.toISOString() }
  assert.equal(healthStatus(nextHealth(null, { ok: true, now: NOW }), snap, NOW).status, 'ok')
  assert.equal(healthStatus({ consecutive_failures: 2 }, snap, new Date('2026-10-19T00:00:00Z')).status, 'failing')
  assert.equal(healthStatus({ consecutive_failures: 0 }, snap, new Date('2026-10-19T19:00:00Z')).status, 'stale')
  assert.equal(healthStatus(null, null, NOW).status, 'not_connected')
}

// 5. Pages Function: no binding → 503 not_connected; snapshot served with an
//    edge cache; health maps to 200/503; unknown paths 404.
{
  let r = await handleLive({ path: 'market_trends.json', env: {} })
  assert.equal(r.status, 503)
  assert.equal((await r.json()).status, 'not_connected')
  const kv = memoryKV()
  r = await handleLive({ path: 'market_trends.json', env: { WATCH_LIVE: kv } })
  assert.equal(r.status, 503)
  assert.equal((await r.json()).reason, 'no_snapshot_yet')
  await runCollector({ WATCH_LIVE: kv }, { fetchImpl: mockFetch(), now: NOW })
  r = await handleLive({ path: 'market_trends.json', env: { WATCH_LIVE: kv }, now: NOW })
  assert.equal(r.status, 200)
  assert.equal(r.headers.get('cache-control'), 'public, max-age=600')
  assert.ok(isUsableSnapshot(await r.json()))
  r = await handleLive({ path: 'health.json', env: { WATCH_LIVE: kv }, now: NOW })
  assert.equal(r.status, 200)
  assert.equal((await r.json()).status, 'ok')
  r = await handleLive({ path: 'health.json', env: { WATCH_LIVE: kv }, now: new Date('2026-10-21T00:00:00Z') })
  assert.equal(r.status, 503)
  assert.equal((await r.json()).status, 'stale')
  r = await handleLive({ path: '../secrets', env: { WATCH_LIVE: kv } })
  assert.equal(r.status, 404)

  r = await worker.fetch(new Request('https://watch-live.example/health'), {})
  assert.equal(r.status, 503)
  assert.equal((await r.json()).status, 'not_connected')
  r = await worker.fetch(new Request('https://watch-live.example/health'), { WATCH_LIVE: { async get() { throw new Error('kv down') } } })
  assert.equal(r.status, 503)
  assert.equal((await r.json()).reason, 'kv_read_failed')
  r = await worker.fetch(new Request('https://watch-live.example/run'), { WATCH_LIVE: kv })
  assert.equal(r.status, 404)
  const routes = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'))
  assert.equal(routes.version, 1)
  assert.deepEqual(routes.include, ['/live/*'], 'Functions may run only on /live/*, never on static pages')
  assert.deepEqual(routes.exclude, [])
}

// 6. Frontend chooser: fresher valid snapshot wins; junk falls back; source
//    line names a missing source instead of dropping it.
{
  const build = JSON.parse(readFileSync(new URL('../public/data/market_trends.json', import.meta.url), 'utf8'))
  const { snapshot: live } = await collectAttention({ watchlist, fetchImpl: mockFetch(), now: new Date(Date.parse(build.built_at) + 86_400_000) })
  assert.equal(pickFresher(live, build).origin, 'live')
  assert.equal(pickFresher({ ...live, built_at: '2020-01-01T00:00:00Z' }, build).origin, 'build', 'stale KV never hides a newer deploy')
  assert.equal(pickFresher('<!doctype html>', build).origin, 'build', 'SPA fallback HTML is not a snapshot')
  assert.equal(pickFresher({ ...live, trending: [] }, build).origin, 'build')
  assert.equal(pickFresher(null, null).snapshot, null)
  assert.equal(sourceLine(live.sources), 'WIKIMEDIA PAGEVIEWS + GOOGLE TRENDS NOT CONNECTED')
  assert.equal(sourceLine(build.sources), 'GOOGLE TRENDS + WIKIMEDIA PAGEVIEWS')
  assert.equal(sourceLine([]), 'SOURCES NOT LISTED')
}

// 7. The retired GitHub Actions schedule stays retired (budget-blocked on
//    purpose); the workflow is manual-only.
{
  const wf = readFileSync(new URL('../.github/workflows/daily-market-trends.yml', import.meta.url), 'utf8')
  assert.ok(!/^\s*schedule:/m.test(wf), 'daily-market-trends.yml must not carry a cron schedule')
}

console.log('✓ live pipeline: collector, Worker cron, Pages Function, chooser, health, retired Actions cron')
