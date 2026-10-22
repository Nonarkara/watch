// Pages Function: serves the live attention snapshot from KV at
//   /live/market_trends.json   the snapshot (503 + not_connected if absent)
//   /live/health.json          ok | stale | failing | not_connected
// Same origin as the site, so the CSP needs no change. Only /live/* invokes a
// Function; every other path stays a free static asset. Responses are cached
// at the edge for 10 minutes to keep KV reads and invocations low.
import { healthStatus } from '../../worker/live/attention.mjs'

const PATHS = new Set(['market_trends.json', 'health.json'])

function json(status, body, maxAge = 0) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
      'x-content-type-options': 'nosniff',
    },
  })
}

export async function handleLive({ path, env, now = new Date() }) {
  if (!PATHS.has(path)) return json(404, { status: 'unknown_path' })
  const kv = env?.WATCH_LIVE
  if (!kv) return json(503, { status: 'not_connected', reason: 'kv_binding_missing' }, 60)
  let snapshot = null
  let health = null
  try {
    ;[snapshot, health] = await Promise.all([kv.get('attention:latest', 'json'), kv.get('health', 'json')])
  } catch {
    return json(503, { status: 'not_connected', reason: 'kv_read_failed' }, 60)
  }
  if (path === 'market_trends.json') {
    if (!snapshot) return json(503, { status: 'not_connected', reason: 'no_snapshot_yet' }, 60)
    return json(200, snapshot, 600)
  }
  const s = healthStatus(health, snapshot, now)
  return json(s.status === 'ok' ? 200 : 503, { ...s, ...(health || {}), snapshot_built_at: snapshot?.built_at ?? null }, 60)
}

export async function onRequestGet(context) {
  const { request, env, params } = context
  const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '')
  // Query strings do not affect these public snapshots. Share one cache key
  // per route so cache-busting query parameters cannot multiply KV reads.
  const cacheUrl = new URL(request.url)
  cacheUrl.search = ''
  const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' })
  const cache = typeof caches !== 'undefined' ? caches.default : null
  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit
  }
  const res = await handleLive({ path, env })
  if (cache && res.headers.get('cache-control')?.startsWith('public')) {
    context.waitUntil(cache.put(cacheKey, res.clone()))
  }
  return res
}
