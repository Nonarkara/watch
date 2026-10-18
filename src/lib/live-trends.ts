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
  return (
    typeof v.as_of === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v.as_of) &&
    typeof v.built_at === 'string' &&
    Number.isFinite(Date.parse(v.built_at)) &&
    Array.isArray(v.trending) &&
    v.trending.length > 0 &&
    Array.isArray(v.sources)
  )
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
