import type { ScreenEvent } from './data.ts'

export interface RolexCatalogRecord {
  id: string
  brand: string
  reference: string
  configuration_reference: string
  name: string
  collection: string
  listed_price_usd: number
  image_url: string
  source_url: string
  image_credit: string
  rights_status: string
  price_status: string
  observed_at: string
}

export interface RolexCatalog {
  built: string
  count: number
  brand: string
  source: string
  limitation: string
  records: RolexCatalogRecord[]
}

export interface ScreenSnapshot {
  collected: string
  source_url: string
  editorial_url?: string
  count: number
  screen_count: number
  iconic_stills?: number
  limitation: string
  sightings: ScreenEvent[]
}

export interface WatchmakingArtifact {
  id: string
  slot: string
  caption: string
  local: string
  license: string
  artist: string
  source_url: string
  commons_file: string
}

export interface WatchmakingArtifacts {
  built: string
  policy: string
  count: number
  artifacts: WatchmakingArtifact[]
}

let catalogCache: Promise<RolexCatalog> | null = null
let screenCache: Promise<ScreenSnapshot> | null = null
let watchmakingCache: Promise<WatchmakingArtifacts> | null = null

export function loadRolexCatalog(): Promise<RolexCatalog> {
  catalogCache ??= fetch('/data/rolex_catalog.json').then((response) => {
    if (!response.ok) throw new Error(`rolex_catalog.json ${response.status}`)
    return response.json()
  })
  return catalogCache
}

export function loadScreenSightings(): Promise<ScreenSnapshot> {
  screenCache ??= fetch('/data/screen_sightings.json')
    .then((response) => {
      if (!response.ok) throw new Error(`screen_sightings.json ${response.status}`)
      return response.json()
    })
  return screenCache
}

export function loadWatchmakingArtifacts(): Promise<WatchmakingArtifacts> {
  watchmakingCache ??= fetch('/data/watchmaking_artifacts.json').then((response) => {
    if (!response.ok) throw new Error(`watchmaking_artifacts.json ${response.status}`)
    return response.json()
  })
  return watchmakingCache
}

export interface MarketTrendRow {
  rank: number
  id: string
  label: string
  card_id: string
  trends_query: string
  wikipedia_title: string
  wiki_note: string | null
  score: number
  trends: {
    interest: number | null
    momentum: number | null
    points?: number
    window?: string
    source?: string
    geo?: string
    reason?: string
  }
  wikipedia: {
    last_day?: string
    last_views: number | null
    prior_views?: number
    week_views?: number
    dod_pct: number | null
    source?: string
    project?: string
    reason?: string
  }
}

export interface MarketTrendsSnapshot {
  as_of: string
  built_at: string
  count: number
  sources: { id: string; label: string; status: string; harvested?: number; geo?: string; window?: string; project?: string }[]
  method: string
  limitation: string
  trending: MarketTrendRow[]
}

let trendsCache: Promise<MarketTrendsSnapshot | null> | null = null
let trendsCacheFailed = false

export function loadMarketTrends(): Promise<MarketTrendsSnapshot | null> {
  if (trendsCacheFailed) {
    trendsCacheFailed = false
    trendsCache = null
  }
  trendsCache ??= fetch('/data/market_trends.json')
    .then((response) => {
      if (!response.ok) return null
      return response.json() as Promise<MarketTrendsSnapshot>
    })
    .catch(() => null)
    .then((data) => {
      if (data === null) { trendsCacheFailed = true; trendsCache = null }
      return data
    })
  return trendsCache
}
