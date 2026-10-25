#!/usr/bin/env node
// Collect daily public-attention signals for a curated watchlist.
//
// Sources (both free, both cited on the face of the UI):
//   1. Google Trends interest-over-time (US, last 7 days, hourly) — unofficial
//      explore + widgetdata endpoints. Values are relative 0–100 *within each
//      batch of ≤5 queries*. We score momentum (recent 24h mean − prior 24h),
//      which is valid inside a series, and never claim absolute market share.
//   2. Wikimedia Pageviews (en.wikipedia, daily, prior 8 days) — official REST.
//      Absolute user pageviews. Day-over-day change is the primary rank key.
//
// Conservation: every published row maps to a live card.id. Missing sources
// degrade honestly (null + reason). The script writes public/data/market_trends.json
// and refuses to invent numbers when both sources fail.
//
// Run: node scripts/collect_market_trends.mjs
// Soft-fail mode for CI builds: TRENDS_SOFT=1 (keeps prior snapshot on harvest failure)

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { collectAttention, MIN_SIGNAL_ROWS } from '../worker/live/attention.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const WATCHLIST = join(ROOT, 'data/shared/trend_watchlist.json')
const OUT = join(ROOT, 'public/data/market_trends.json')
const SHARED_OUT = join(ROOT, 'data/shared/market_trends.json')
const COOKIE = join(ROOT, '.cache/gt.cookies')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const WIKI_UA = 'TimePopBot/1.0 (https://watch.nonarkara.org; market-attention research)'

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function curlJson(url, { cookies = true } = {}) {
  mkdirSync(dirname(COOKIE), { recursive: true })
  const args = ['-sL', '-A', UA, '--max-time', '45']
  if (cookies) args.push('-c', COOKIE, '-b', COOKIE)
  args.push(url)
  const raw = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  let body = raw.trim()
  if (body.startsWith(")]}'")) body = body.slice(4).replace(/^[\s,]+/, '')
  if (!body || body.startsWith('<!')) {
    throw new Error(`non-JSON response from ${url.slice(0, 80)}… (${body.slice(0, 60)})`)
  }
  return JSON.parse(body)
}

function ymd(d) {
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}

function mean(xs) {
  if (!xs.length) return null
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** Google Trends: batches of ≤5. Returns Map<query, {interest, momentum, points}> */
async function harvestGoogleTrends(queries) {
  const out = new Map()
  // Warm cookie jar
  try {
    execFileSync('curl', ['-sL', '-A', UA, '-c', COOKIE, '-b', COOKIE, '--max-time', '20',
      'https://trends.google.com/trends/?geo=US', '-o', '/dev/null'], { stdio: 'ignore' })
  } catch { /* warm is best-effort */ }
  await sleep(1500)

  for (let i = 0; i < queries.length; i += 5) {
    const batch = queries.slice(i, i + 5)
    const req = {
      comparisonItem: batch.map((keyword) => ({ keyword, geo: 'US', time: 'now 7-d' })),
      category: 0,
      property: '',
    }
    const exploreUrl =
      'https://trends.google.com/trends/api/explore?hl=en-US&tz=420&req=' +
      encodeURIComponent(JSON.stringify(req))
    let explore
    try {
      explore = curlJson(exploreUrl)
    } catch (err) {
      console.warn(`  trends explore failed for batch ${i / 5 + 1}: ${err.message}`)
      await sleep(4000)
      continue
    }
    const widget = (explore.widgets || []).find((w) => w.id === 'TIMESERIES')
    if (!widget?.token) {
      console.warn(`  trends: no TIMESERIES widget for batch ${i / 5 + 1}`)
      continue
    }
    await sleep(2000)
    const tsUrl =
      'https://trends.google.com/trends/api/widgetdata/multiline?hl=en-US&tz=420&req=' +
      encodeURIComponent(JSON.stringify(widget.request)) +
      '&token=' + encodeURIComponent(widget.token)
    let ts
    try {
      ts = curlJson(tsUrl)
    } catch (err) {
      console.warn(`  trends timeseries failed for batch ${i / 5 + 1}: ${err.message}`)
      await sleep(4000)
      continue
    }
    const timeline = ts?.default?.timelineData || []
    const averages = ts?.default?.averages || []
    batch.forEach((keyword, idx) => {
      const vals = []
      for (const p of timeline) {
        const hd = p.hasData
        if (Array.isArray(hd) && hd[idx] === false) continue
        const v = Number(p.value?.[idx])
        if (Number.isFinite(v)) vals.push(v)
      }
      const recent = vals.slice(-24)
      const prior = vals.slice(-48, -24)
      const interest = averages[idx] ?? mean(vals)
      const r = mean(recent)
      const p = mean(prior)
      out.set(keyword, {
        interest: interest == null ? null : Math.round(interest * 10) / 10,
        momentum: r != null && p != null ? Math.round((r - p) * 10) / 10 : null,
        points: vals.length,
        window: 'US · now 7-d · hourly',
      })
    })
    await sleep(2500)
  }
  return out
}

/** Wikipedia pageviews for one article over the last `days` complete UTC days. */
async function wikiViews(title, days = 8) {
  const end = new Date()
  end.setUTCDate(end.getUTCDate() - 1) // yesterday — today often incomplete
  const start = new Date(end)
  start.setUTCDate(start.getUTCDate() - (days - 1))
  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/` +
    `${encodeURIComponent(title)}/daily/${ymd(start)}/${ymd(end)}`
  const res = await fetch(url, { headers: { 'User-Agent': WIKI_UA } })
  if (res.status === 404) return { ok: false, reason: 'no_article' }
  if (!res.ok) return { ok: false, reason: `http_${res.status}` }
  const items = (await res.json()).items || []
  const series = items.map((it) => ({
    day: String(it.timestamp).slice(0, 8),
    views: it.views,
  }))
  if (series.length < 2) return { ok: false, reason: 'insufficient_days', series }
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  const week = series.reduce((s, x) => s + x.views, 0)
  const dod = prev.views > 0 ? ((last.views - prev.views) / prev.views) * 100 : null
  return {
    ok: true,
    last_day: last.day,
    last_views: last.views,
    prior_views: prev.views,
    week_views: week,
    dod_pct: dod == null ? null : Math.round(dod * 10) / 10,
    series,
  }
}

function rankScore(row) {
  // Primary: Wikipedia day-over-day % — only when the prior day had enough
  // views that a percentage is meaningful (avoids 1→2 = "+100%" noise).
  // Secondary: Google Trends 24h momentum (relative within its batch).
  // Tertiary: log10 of last-day views (absolute attention floor).
  const prior = row.wikipedia?.prior_views
  const dod = row.wikipedia?.dod_pct
  const mom = row.trends?.momentum
  const views = row.wikipedia?.last_views
  let score = 0
  if (dod != null && prior != null && prior >= 40) {
    score += Math.max(-50, Math.min(50, dod)) * 2
  } else if (dod != null && prior != null && views != null) {
    // Low-volume articles: use absolute view delta, not percentage.
    score += Math.max(-30, Math.min(30, views - prior)) * 0.5
  }
  if (mom != null) score += mom
  if (views != null) score += Math.log10(views + 1)
  return score
}

async function main() {
  const soft = process.env.TRENDS_SOFT === '1'
  const watchlist = JSON.parse(readFileSync(WATCHLIST, 'utf8'))
  const publicData = JSON.parse(readFileSync(join(ROOT, 'public/data.json'), 'utf8'))
  const liveIds = new Set(publicData.cards.map((c) => c.id))

  const items = watchlist.items.filter((it) => {
    if (!liveIds.has(it.card_id)) {
      console.warn(`  skip ${it.id}: card ${it.card_id} not in live register`)
      return false
    }
    return true
  })

  // The same validated, official-source path used by the Worker is also a
  // manual recovery route when Google's unofficial endpoint is unavailable.
  if (process.argv.includes('--wikipedia-only')) {
    const { snapshot, signalRows, total } = await collectAttention({
      watchlist: { ...watchlist, items }, pauseMs: 350, collector: 'manual-wikimedia',
    })
    if (signalRows < MIN_SIGNAL_ROWS) throw new Error(`Only ${signalRows}/${total} usable Wikimedia rows; kept prior snapshot`)
    mkdirSync(dirname(OUT), { recursive: true })
    for (const file of [OUT, SHARED_OUT]) writeFileSync(file, JSON.stringify(snapshot, null, 2) + '\n')
    console.log(`✓ ${signalRows}/${total} Wikimedia rows · Google Trends not connected · ${snapshot.as_of}`)
    return
  }

  console.log(`Harvesting market attention for ${items.length} watchlist rows…`)

  const queries = [...new Set(items.map((it) => it.trends_query))]
  let trends = new Map()
  try {
    trends = await harvestGoogleTrends(queries)
    console.log(`  Google Trends: ${trends.size}/${queries.length} queries`)
  } catch (err) {
    console.warn(`  Google Trends harvest aborted: ${err.message}`)
  }

  const rows = []
  for (const it of items) {
    await sleep(350) // Wikimedia rate courtesy
    const wiki = await wikiViews(it.wikipedia)
    const t = trends.get(it.trends_query) || null
    const row = {
      id: it.id,
      label: it.label,
      card_id: it.card_id,
      trends_query: it.trends_query,
      wikipedia_title: it.wikipedia,
      wiki_note: it.wiki_note || null,
      trends: t
        ? {
            interest: t.interest,
            momentum: t.momentum,
            points: t.points,
            window: t.window,
            source: 'Google Trends (unofficial explore API)',
            geo: 'US',
          }
        : { interest: null, momentum: null, reason: 'trends_unavailable' },
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
  const withSignal = ranked.filter(
    (r) => r.wikipedia?.last_views != null || r.trends?.interest != null,
  )

  if (withSignal.length === 0) {
    const msg = 'market trends harvest produced zero usable signals'
    if (soft && existsSync(OUT)) {
      console.warn(`SOFT: ${msg} — keeping prior snapshot`)
      process.exit(0)
    }
    throw new Error(msg)
  }

  const asOf = new Date().toISOString().slice(0, 10)
  const snapshot = {
    as_of: asOf,
    built_at: new Date().toISOString(),
    count: withSignal.length,
    sources: [
      {
        id: 'google_trends',
        label: 'Google Trends',
        geo: 'US',
        window: 'now 7-d',
        status: trends.size ? 'ok' : 'unavailable',
        harvested: trends.size,
      },
      {
        id: 'wikipedia_pageviews',
        label: 'Wikimedia Pageviews',
        project: 'en.wikipedia',
        window: 'last 8 complete UTC days',
        status: 'ok',
      },
    ],
    method:
      'Rank = 2× Wikipedia day-over-day % change + Google Trends 24h momentum (when present) + log10(last-day views). Trends interest is relative within each ≤5-query batch — never treated as absolute share.',
    limitation:
      watchlist.limitation +
      ' This is public attention, not grey-market price or sell-through. A rising Wikipedia day can be a news spike, not a buying wave.',
    trending: ranked.map((r, i) => ({ rank: i + 1, ...r })),
  }

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n')
  writeFileSync(SHARED_OUT, JSON.stringify(snapshot, null, 2) + '\n')
  console.log(`✓ ${withSignal.length} rows → ${OUT.replace(ROOT + '/', '')} (as_of ${asOf})`)
  console.log('  Top 5:')
  for (const [i, r] of ranked.slice(0, 5).entries()) {
    const w = r.wikipedia?.dod_pct != null ? `wiki ${r.wikipedia.dod_pct > 0 ? '+' : ''}${r.wikipedia.dod_pct}%` : 'wiki —'
    const t = r.trends?.momentum != null ? `gtrends Δ${r.trends.momentum > 0 ? '+' : ''}${r.trends.momentum}` : 'gtrends —'
    console.log(`   ${String(i + 1).padStart(2)}. ${r.label}  (${w}, ${t})`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
