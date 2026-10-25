// Live attention pipeline: collector, Worker cron, Pages Function, and the
// frontend's live-vs-build chooser. No network: every fetch is mocked.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { collectAttention, nextHealth, healthStatus, rankScore, MAX_ROWS, wikiViews } from '../worker/live/attention.mjs'
import worker, { runCollector } from '../worker/live/index.mjs'
import { handleLive, onRequestGet } from '../functions/live/[[path]].js'
import { pickFresher, isUsableSnapshot, sourceLine } from '../src/lib/live-trends.ts'

const watchlist = JSON.parse(readFileSync(new URL('../data/shared/trend_watchlist.json', import.meta.url), 'utf8'))
const cards = new Set(JSON.parse(readFileSync(new URL('../public/data.json', import.meta.url), 'utf8')).cards.map((c) => c.id))
const NOW = new Date('2026-10-18T06:40:00Z')

// Untrusted upstream JSON must not turn missing values, duplicate dates or
// multi-day gaps into valid daily demand signals.
{
  const read = (payload) => wikiViews('Rolex', {
    now: NOW,
    fetchImpl: async () => ({ ok: true, json: async () => payload }),
  })
  for (const payload of [null, { items: {} }, { items: [null] },
    { items: [{ timestamp: '2026101600', views: -1 }] },
    { items: [{ timestamp: '2026101600', views: null }] },
    { items: [{ timestamp: '2026101600', views: '100' }] },
    { items: [{ timestamp: '2026103200', views: 100 }] },
    { items: [{ timestamp: '2026101800', views: 100 }] },
    { items: Array(9).fill({ timestamp: '2026101600', views: 100 }) },
    { items: Array(2).fill({ timestamp: '2026101600', views: 100 }) },
  ]) assert.equal((await read(payload)).ok, false, 'malformed upstream series must degrade to a reason')
  assert.equal((await read({ items: [
    { timestamp: '2026101500', views: 100 }, { timestamp: '2026101700', views: 120 },
  ] })).reason, 'nonconsecutive_days')
  const unordered = await read({ items: [
    { timestamp: '2026101700', views: 120 }, { timestamp: '2026101600', views: 100 },
  ] })
  assert.equal(unordered.dod_pct, 20, 'daily change follows dates, not response order')
}

// Queries cannot fragment the cache for an invariant public snapshot. Cache
// hits must serve the next query without touching KV again.
{
  const original = Object.getOwnPropertyDescriptor(globalThis, 'caches')
  const entries = new Map()
  const pending = []
  let reads = 0
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { default: {
    async match(key) { return entries.get(key.url)?.clone() },
    async put(key, response) { entries.set(key.url, response) },
  } } })
  try {
    const env = { WATCH_LIVE: { async get(key) {
      reads++
      return key === 'attention:latest' ? { built_at: NOW.toISOString(), trending: [] } : null
    } } }
    for (const query of ['?cachebust=1', '?cachebust=2']) {
      const result = await onRequestGet({ request: new Request(`https://watch.example/live/market_trends.json${query}`),
        env, params: { path: ['market_trends.json'] }, waitUntil(promise) { pending.push(promise) } })
      assert.equal(result.status, 200)
      await Promise.all(pending)
    }
    assert.equal(reads, 2, 'only the first request may read the two KV keys')
    assert.deepEqual([...entries.keys()], ['https://watch.example/live/market_trends.json'])
  } finally {
    if (original) Object.defineProperty(globalThis, 'caches', original)
    else delete globalThis.caches
  }
}

function wikiResponse(views, endDay) {
  const end = new Date(`${endDay.slice(0, 4)}-${endDay.slice(4, 6)}-${endDay.slice(6, 8)}T00:00:00Z`)
  return { ok: true, status: 200, json: async () => ({ items: views.map((v, i) => {
    const date = new Date(end)
    date.setUTCDate(date.getUTCDate() - (views.length - 1 - i))
    return { timestamp: date.toISOString().slice(0, 10).replaceAll('-', '') + '00', views: v }
  }) }) }
}
function mockFetch({ fail = new Set(), status = 500 } = {}) {
  const calls = []
  const fn = async (url, init) => {
    calls.push({ url, ua: init?.headers?.['User-Agent'] })
    const title = decodeURIComponent(url.split('/user/')[1].split('/daily/')[0])
    if (fail.has(title) || fail.has('*')) return { ok: false, status, json: async () => ({}) }
    return wikiResponse([100, 110, 120, 130, 140, 150, 160, 200], url.split('/').at(-1))
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
  for (const badRows of [[null], [{ ...live.trending[0], score: Infinity }],
    [{ ...live.trending[0], wikipedia: { last_views: -1, dod_pct: null } }],
    [{ ...live.trending[0], card_id: 'javascript:alert(1)' }],
    [live.trending[0], live.trending[0]],
  ]) {
    assert.equal(pickFresher({ ...live, trending: badRows }, build).origin, 'build',
      'a newer timestamp cannot make malformed live rows outrank the valid build')
  }
  assert.equal(isUsableSnapshot({ ...live, sources: [null] }), false)
  assert.equal(isUsableSnapshot({ ...live, as_of: '2026-02-31' }), false)
  assert.equal(isUsableSnapshot({ ...live, count: 999 }), false, 'displayed signal count must match usable rows')
  assert.equal(pickFresher(null, null).snapshot, null)
  assert.equal(sourceLine(live.sources), 'WIKIMEDIA PAGEVIEWS + GOOGLE TRENDS NOT CONNECTED')
  assert.equal(sourceLine([{ label: 'Google Trends', status: 'ok' }, { label: 'Wikimedia Pageviews', status: 'ok' }]), 'GOOGLE TRENDS + WIKIMEDIA PAGEVIEWS')
  assert.equal(sourceLine([]), 'SOURCES NOT LISTED')
}

// 7. The retired GitHub Actions schedule stays retired (budget-blocked on
//    purpose); the workflow is manual-only.
{
  const wf = readFileSync(new URL('../.github/workflows/daily-market-trends.yml', import.meta.url), 'utf8')
  assert.ok(!/^\s*schedule:/m.test(wf), 'daily-market-trends.yml must not carry a cron schedule')
}

console.log('✓ live pipeline: collector, Worker cron, Pages Function, chooser, health, retired Actions cron')
