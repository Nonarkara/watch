// Cloudflare Worker "watch-live": once a day it refreshes the Time Pop
// attention snapshot into KV. The site reads it through the Pages Function in
// functions/live/. Nothing here runs on the M3 or any of Non's machines.
//
// KV keys (2 writes per run, far inside the free 1,000 writes/day):
//   attention:latest  last good snapshot (never overwritten by a bad run)
//   health            last_attempt, last_ok, consecutive_failures, last_error
import watchlist from '../../data/shared/trend_watchlist.json' with { type: 'json' }
import { collectAttention, nextHealth, healthStatus, MIN_SIGNAL_ROWS } from './attention.mjs'

export async function runCollector(env, { fetchImpl = globalThis.fetch, now = new Date(), list = watchlist } = {}) {
  const kv = env.WATCH_LIVE
  if (!kv) throw new Error('WATCH_LIVE KV binding missing')
  const prev = await kv.get('health', 'json')
  try {
    const { snapshot, signalRows, total } = await collectAttention({ watchlist: list, fetchImpl, now })
    if (signalRows < MIN_SIGNAL_ROWS) {
      throw Object.assign(new Error(`only ${signalRows}/${total} rows had a signal; kept the previous snapshot`), { rows: signalRows, total })
    }
    await kv.put('attention:latest', JSON.stringify(snapshot))
    await kv.put('health', JSON.stringify(nextHealth(prev, { ok: true, now, rows: signalRows, total })))
    return { ok: true, rows: signalRows, total }
  } catch (err) {
    await kv.put('health', JSON.stringify(nextHealth(prev, { ok: false, now, rows: err.rows ?? 0, total: err.total ?? 0, error: err.message })))
    return { ok: false, error: err.message }
  }
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(runCollector(env).then((r) => console.log(JSON.stringify(r))))
  },
  // Only a read-only health view. There is no public "run now" trigger.
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/health') return new Response('not found', { status: 404 })
    const kv = env?.WATCH_LIVE
    if (!kv) {
      return Response.json(
        { status: 'not_connected', reason: 'kv_binding_missing' },
        { status: 503, headers: { 'cache-control': 'no-store' } },
      )
    }
    try {
      const [health, snapshot] = await Promise.all([kv.get('health', 'json'), kv.get('attention:latest', 'json')])
      const s = healthStatus(health, snapshot)
      return Response.json(
        { ...s, ...(health || {}), snapshot_built_at: snapshot?.built_at ?? null },
        { status: s.status === 'ok' ? 200 : 503, headers: { 'cache-control': 'no-store' } },
      )
    } catch {
      return Response.json(
        { status: 'not_connected', reason: 'kv_read_failed' },
        { status: 503, headers: { 'cache-control': 'no-store' } },
      )
    }
  },
}
