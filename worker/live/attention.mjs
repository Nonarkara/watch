// Time Pop live attention collector: pure logic shared by the Cloudflare
// Worker cron (worker/live/index.mjs), the local runner (run-local.mjs) and
// the tests. It does no I/O of its own; callers pass fetch.
//
// Source policy (credited on the face of the UI):
//   - Wikimedia Pageviews REST API: official, free, keyless. Wikimedia asks
//     for a descriptive User-Agent, which we send.
//   - Google Trends is deliberately NOT collected here. The only automated
//     route is an unofficial endpoint, so the scheduled collector marks it
//     "not_connected" instead of scraping it or inventing numbers.
//
// Caps: Workers Free allows 50 subrequests per invocation. One article is one
// request, so the watchlist is capped at MAX_ROWS and the rest is reported.

export const WIKI_UA = 'TimePopBot/1.0 (https://watch.nonarkara.org; market-attention research)'
export const MAX_ROWS = 40
export const MIN_SIGNAL_ROWS = 5
export const STALE_AFTER_HOURS = 36
export const FAILING_AFTER_RUNS = 2
export const SCHEDULE = 'daily 06:40 UTC (13:40 ICT)'

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

export async function wikiViews(title, { fetchImpl, now = new Date(), days = 8 } = {}) {
  const end = new Date(now)
  end.setUTCDate(end.getUTCDate() - 1) // yesterday: today is incomplete
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const url =
    'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/' +
    `${encodeURIComponent(title)}/daily/${ymd(start)}/${ymd(end)}`
  let res
  try {
    const init = { headers: { 'User-Agent': WIKI_UA, 'Api-User-Agent': WIKI_UA } }
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) init.signal = AbortSignal.timeout(15000)
    res = await fetchImpl(url, init)
  } catch (err) {
    return { ok: false, reason: 'fetch_failed', error: String(err?.message || err).slice(0, 120) }
  }
  if (res.status === 404) return { ok: false, reason: 'no_article' }
  if (!res.ok) return { ok: false, reason: `http_${res.status}` }
  let items
  try {
    items = (await res.json())?.items
  } catch {
    return { ok: false, reason: 'bad_json' }
  }
  if (!Array.isArray(items) || items.length > days) return { ok: false, reason: 'invalid_series' }
  const seen = new Set()
  const series = []
  for (const item of items) {
    const stamp = String(item?.timestamp ?? '')
    const day = stamp.slice(0, 8)
    const date = new Date(`${day.slice(0, 4)}-${day.slice(4, 6)}-${day.slice(6, 8)}T00:00:00Z`)
    if (!/^\d{8}00$/.test(stamp) || !Number.isFinite(date.getTime()) || ymd(date) !== day
      || day < ymd(start) || day > ymd(end) || seen.has(day)
      || !Number.isSafeInteger(item?.views) || item.views < 0) {
      return { ok: false, reason: 'invalid_series' }
    }
    seen.add(day)
    series.push({ day, views: item.views })
  }
  series.sort((a, b) => a.day.localeCompare(b.day))
  if (series.length < 2) return { ok: false, reason: 'insufficient_days' }
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  if (new Date(`${last.day.slice(0, 4)}-${last.day.slice(4, 6)}-${last.day.slice(6, 8)}T00:00:00Z`) -
    new Date(`${prev.day.slice(0, 4)}-${prev.day.slice(4, 6)}-${prev.day.slice(6, 8)}T00:00:00Z`) !== 86400000) {
    return { ok: false, reason: 'nonconsecutive_days' }
  }
  const week = series.reduce((s, x) => s + x.views, 0)
  const dod = prev.views > 0 ? ((last.views - prev.views) / prev.views) * 100 : null
  return {
    ok: true,
    last_day: last.day,
    last_views: last.views,
    prior_views: prev.views,
    week_views: week,
    dod_pct: dod == null ? null : Math.round(dod * 10) / 10,
  }
}

// Same formula as scripts/collect_market_trends.mjs, so a row ranks the same
// whichever collector produced it. With Trends not connected, momentum is null.
export function rankScore(row) {
  const prior = row.wikipedia?.prior_views
  const dod = row.wikipedia?.dod_pct
  const mom = row.trends?.momentum
  const views = row.wikipedia?.last_views
  let score = 0
  if (dod != null && prior != null && prior >= 40) {
    score += Math.max(-50, Math.min(50, dod)) * 2
  } else if (dod != null && prior != null && views != null) {
    score += Math.max(-30, Math.min(30, views - prior)) * 0.5
  }
  if (mom != null) score += mom
  if (views != null) score += Math.log10(views + 1)
  return score
}

export async function collectAttention({ watchlist, fetchImpl = globalThis.fetch, now = new Date(), pauseMs = 0, collector = 'cloudflare-worker-cron' }) {
  const all = Array.isArray(watchlist?.items) ? watchlist.items : []
  const items = all.filter((it) => it && it.card_id && it.wikipedia).slice(0, MAX_ROWS)
  const skipped = all.length - items.length
  const rows = []
  for (const it of items) {
    if (pauseMs) await new Promise((r) => setTimeout(r, pauseMs))
    const wiki = await wikiViews(it.wikipedia, { fetchImpl, now })
    const row = {
      id: it.id,
      label: it.label,
      card_id: it.card_id,
      trends_query: it.trends_query ?? null,
      wikipedia_title: it.wikipedia,
      wiki_note: it.wiki_note || null,
      trends: { interest: null, momentum: null, reason: 'not_connected' },
      wikipedia: wiki.ok
        ? {
            last_day: wiki.last_day,
            last_views: wiki.last_views,
            prior_views: wiki.prior_views,
            week_views: wiki.week_views,
            dod_pct: wiki.dod_pct,
            source: 'Wikimedia Pageviews API',
            project: 'en.wikipedia',
          }
        : { last_views: null, dod_pct: null, reason: wiki.reason },
    }
    row.score = Math.round(rankScore(row) * 100) / 100
    rows.push(row)
  }
  const ranked = [...rows].sort((a, b) => b.score - a.score)
  const signalRows = ranked.filter((r) => r.wikipedia.last_views != null).length
  const snapshot = {
    as_of: now.toISOString().slice(0, 10),
    built_at: now.toISOString(),
    count: signalRows,
    // Wikimedia publishes daily counts with a lag; as_of is the collection day,
    // data_through is the newest day the counts actually cover.
    data_through: ranked.map((r) => r.wikipedia.last_day).filter(Boolean).sort().at(-1) ?? null,
    collector,
    sources: [
      {
        id: 'google_trends',
        label: 'Google Trends',
        geo: 'US',
        status: 'not_connected',
        harvested: 0,
        note: 'Only an unofficial endpoint exists; the scheduled collector does not call it.',
      },
      {
        id: 'wikipedia_pageviews',
        label: 'Wikimedia Pageviews',
        project: 'en.wikipedia',
        window: 'last 8 complete UTC days',
        status: signalRows === 0 ? 'failed' : signalRows < rows.length ? 'partial' : 'ok',
        harvested: signalRows,
      },
    ],
    method:
      'Rank = 2× Wikipedia day-over-day % change (prior day ≥ 40 views; otherwise half the absolute view delta) + log10(last-day views). Google Trends is not connected in the scheduled collector.',
    limitation:
      String(watchlist?.limitation || '') +
      ' This is public attention, not grey-market price or sell-through. A rising Wikipedia day can be a news spike, not a buying wave.',
    skipped_rows: skipped,
    trending: ranked.map((r, i) => ({ rank: i + 1, ...r })),
  }
  return { snapshot, signalRows, total: rows.length }
}

export function nextHealth(prev, { ok, now, rows = 0, total = 0, error = null }) {
  const p = prev && typeof prev === 'object' ? prev : {}
  return {
    schedule: SCHEDULE,
    last_attempt: now.toISOString(),
    last_ok: ok ? now.toISOString() : p.last_ok ?? null,
    consecutive_failures: ok ? 0 : (Number(p.consecutive_failures) || 0) + 1,
    last_error: ok ? null : String(error || 'unknown').slice(0, 200),
    last_rows: rows,
    last_total: total,
  }
}

// ok | stale | failing | not_connected. Staleness is judged on the snapshot
// actually being served, not on whether the last run "succeeded".
export function healthStatus(health, snapshot, now = new Date()) {
  if (!snapshot) return { status: 'not_connected', age_hours: null }
  const built = Date.parse(snapshot.built_at)
  const age = Number.isFinite(built) ? Math.round(((now - built) / 3_600_000) * 10) / 10 : null
  if (age == null || age > STALE_AFTER_HOURS) return { status: 'stale', age_hours: age }
  if ((Number(health?.consecutive_failures) || 0) >= FAILING_AFTER_RUNS) return { status: 'failing', age_hours: age }
  return { status: 'ok', age_hours: age }
}
