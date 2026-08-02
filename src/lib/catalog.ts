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

let catalogCache: Promise<RolexCatalog> | null = null
let screenCache: Promise<ScreenSnapshot> | null = null

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
      if (response.ok) return response.json()
      // Legacy fallback while older deploys catch up
      return fetch('/data/watch_id_rolex.json').then((legacy) => {
        if (!legacy.ok) throw new Error(`screen_sightings.json ${response.status}`)
        return legacy.json()
      })
    })
  return screenCache
}
