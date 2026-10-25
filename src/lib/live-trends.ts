// Chooses between the live attention snapshot (/live/market_trends.json, from
// the Cloudflare cron) and the snapshot baked into the build
// (/data/market_trends.json). The fresher valid one wins, so a stale KV entry
// can never hide a newer hand deploy, and a broken live endpoint falls back
// to the build copy. No imports: the tests load this file directly.

export type TrendsOrigin = 'live' | 'build'

interface SourceLike {
  label: string
  status: string
}

interface SnapshotLike {
  as_of: string
  built_at: string
  trending: unknown[]
  sources: SourceLike[]
}

export function isUsableSnapshot(value: unknown): value is SnapshotLike {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  if (typeof v.as_of !== 'string' || !Number.isFinite(Date.parse(v.as_of))
    || new Date(v.as_of).toISOString().slice(0, 10) !== v.as_of) return false
  const validShell = (
    typeof v.as_of === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.as_of) &&
    typeof v.built_at === 'string' &&
    Number.isFinite(Date.parse(v.built_at)) &&
    Array.isArray(v.trending) &&
    v.trending.length > 0 && v.trending.length <= 100 &&
    Array.isArray(v.sources)
  )
  if (!validShell) return false
  const rows = v.trending as unknown[]
  const sources = v.sources as unknown[]
  const ids = new Set<string>()
  const ranks = new Set<number>()
  let signalRows = 0
  const nullableNumber = (n: unknown) => n === null || (typeof n === 'number' && Number.isFinite(n))
  const count = (n: unknown) => n === null || (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0)
  for (const row of rows) {
    if (!row || typeof row !== 'object') return false
    const r = row as Record<string, unknown>
    if (typeof r.id !== 'string' || !r.id || ids.has(r.id)
      || typeof r.card_id !== 'string' || !/^[a-z0-9-]+$/.test(r.card_id)
      || typeof r.label !== 'string' || !r.label.trim()
      || typeof r.rank !== 'number' || !Number.isInteger(r.rank) || r.rank < 1 || r.rank > rows.length || ranks.has(r.rank)
      || typeof r.score !== 'number' || !Number.isFinite(r.score)
      || !r.wikipedia || typeof r.wikipedia !== 'object'
      || !r.trends || typeof r.trends !== 'object') return false
    const wiki = r.wikipedia as Record<string, unknown>
    const trends = r.trends as Record<string, unknown>
    if (!count(wiki.last_views) || !nullableNumber(wiki.dod_pct)
      || !nullableNumber(trends.interest) || !nullableNumber(trends.momentum)) return false
    if (wiki.last_views !== null || trends.interest !== null) signalRows++
    ids.add(r.id)
    ranks.add(r.rank)
  }
  return signalRows > 0 && v.count === signalRows && sources.length > 0 && sources.every((source) => {
    if (!source || typeof source !== 'object') return false
    const s = source as Record<string, unknown>
    return typeof s.label === 'string' && Boolean(s.label.trim())
      && ['ok', 'partial', 'failed', 'unavailable', 'not_connected'].includes(String(s.status))
  })
}

export function pickFresher<T extends SnapshotLike>(live: unknown, build: unknown): { snapshot: T | null; origin: TrendsOrigin | null } {
  const l = isUsableSnapshot(live) ? (live as T) : null
  const b = isUsableSnapshot(build) ? (build as T) : null
  if (l && b) return Date.parse(l.built_at) >= Date.parse(b.built_at) ? { snapshot: l, origin: 'live' } : { snapshot: b, origin: 'build' }
  if (l) return { snapshot: l, origin: 'live' }
  if (b) return { snapshot: b, origin: 'build' }
  return { snapshot: null, origin: null }
}

// "WIKIMEDIA PAGEVIEWS + GOOGLE TRENDS NOT CONNECTED": every source is named,
// and one that did not deliver says so instead of being silently dropped.
export function sourceLine(sources: SourceLike[] | undefined): string {
  if (!sources?.length) return 'SOURCES NOT LISTED'
  const ordered = [...sources].sort((a, b) => Number(b.status === 'ok' || b.status === 'partial') - Number(a.status === 'ok' || a.status === 'partial'))
  return ordered
    .map((s) => {
      const label = s.label.toUpperCase()
      if (s.status === 'ok') return label
      if (s.status === 'partial') return `${label} (PARTIAL)`
      return `${label} NOT CONNECTED`
    })
    .join(' + ')
}
