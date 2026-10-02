// Types mirror scripts/build_indices.mjs output. The UI is a dumb renderer of reason codes —
// it never invents fallbacks (anti-fabrication ladder, see context.md).

export interface MsrpEntry { effective_year: number; price_usd: number; source_url: string }
export interface Sale { date: string; price_usd: number; venue: string; url: string; box_papers: string | null }
/** A real, cited sale of a different configuration (special dial, celebrity provenance,
 *  charity lot). Shown as evidence, never fed to the estimator. */
export interface VariantSale { date: string; price_usd: number; venue: string; url: string; condition: string }
export interface ProvenanceEvent { date: string; person_or_event: string; description: string; source_url: string }

export interface Estimate {
  value: number | null; band?: [number, number]; method: string | null;
  n: number; window_months: number | null; venues?: number; as_of: string | null;
  reason: string | null; limitation: string; stale?: boolean;
}
export interface Premium {
  value: number | null; vs?: string; msrp_usd?: number;
  /** True when the baseline is an old list price for a watch still in production —
   *  the displayed premium overstates the real gap. Surfaced inline, not hidden. */
  stale_baseline?: boolean;
  reason: string | null; limitation: string;
}
export interface Change { nominal_pct: number | null; real_pct: number | null; n_now?: number; n_then?: number; reason: string | null; limitation: string }
export interface IndexMetric { value: number; tier?: string; k_of: [number, number]; reason: string | null; limitation: string }
export interface Liquidity { sales_per_year: number; tier: string; reason: string | null; limitation: string }
export interface Confidence { tier: string | null; n: number; venues: number; newest: string | null; reason: string | null }
export interface PriceResponse { value: number | null; reason: string; n_before: number; n_after: number; limitation: string }
export interface Attention {
  value: number | null; screen_count: number; pressure: number | null; reason: string | null;
  limitation: string; price_response: PriceResponse;
}
export interface BrandContext { tier: number | null; label: string | null; source_url: string; limitation: string }
export interface MediaAttachment {
  type: 'image'; url: string; source_url: string; credit: string; rights_status: string;
  /** Present on catalogue matches only. */
  configuration_reference?: string;
  /** Curated photography carries its licence and, when the photograph is of a related
   *  configuration rather than this exact reference, says so in plain words. */
  license?: string | null;
  caption?: string | null;
  match: 'reference_family' | 'exact_reference';
}
/** Optional in-scene / premiere / press still for a specific sighting. When present,
 *  takes precedence over the watch-portrait image lookup. */
export interface SightingMedia {
  type: 'image'; url: string; source_url: string; credit: string;
  license: string; caption: string | null;
}
export interface ScreenEvent {
  id: string; brand: string; watch: string; title: string; description: string;
  media_type: 'film' | 'television' | 'other'; release_year: number | null;
  identification: 'reported' | 'tentative'; match_level: 'exact_reference' | 'family_only';
  matched_card_ids: string[]; source_url: string;
  /** Optional per-sighting in-film / premiere / press still. When present, the
   *  Screen page prefers this image over the watch-portrait fallback. */
  media?: SightingMedia;
  /** Cross-check editorial URL (e.g. Teddy Baldassarre movie-watches roundup). */
  editorial_url?: string;
  /** When true, do not fall back to a dossier portrait — used when another
   *  sighting already shows the same reference image (Milgauss double-map). */
  suppress_portrait_fallback?: boolean;
  shared_with?: string;
}

export interface MarketBand {
  band: string | null; basis_usd?: number; basis?: string; note?: string;
  reason: string | null; limitation: string;
}

export interface Computed {
  estimate: Estimate; premium: Premium; change_1y: Change; change_5y: Change;
  scarcity: IndexMetric; collectibility: IndexMetric; liquidity: Liquidity;
  confidence: Confidence; attention: Attention; market_band: MarketBand;
  resellability: Resellability; as_of_build: string;
}

// Resellability is a composite of how easily a reference changes hands. Inputs:
// liquidity rate (sales/yr), venue diversity (how many auction houses have sold it),
// comp recency (most recent sale), and confidence tier (data-quality). Output 0-100.
export interface Resellability {
  value: number | null;
  tier: 'High' | 'Medium' | 'Low' | 'Unknown';
  k_of: [number, number];
  sales_per_year: number;
  venues: number;
  recency_days: number | null;
  confidence: string | null;
  reason: string | null;
  limitation: string;
}

export interface Card {
  id: string;
  identity: {
    brand: string; reference: string; name: string; nickname: string | null; collection: string;
    tier: 'trinity' | 'crown' | 'haute' | 'core' | 'attainable';
    produced: { start_year: number; end_year: number | null; discontinued: boolean };
    movement: { caliber: string; type: string };
    case: { diameter_mm: number; material: string; bezel: string };
    one_liner: string;
  };
  brand_context: BrandContext;
  media: MediaAttachment[];
  retail: { msrp_history: MsrpEntry[]; current_msrp_usd: number | null };
  scarcity_public: {
    limited_edition: { is_limited: boolean; stated_size: number | null; source_url: string | null };
    discontinued: boolean; waitlist_evidence_n: number;
  };
  provenance_events: ProvenanceEvent[];
  screen_events: ScreenEvent[];
  narrative: { story: string; collector_notes: string | null; starter_alternative: string | null };
  comp_summary: { n: number; venues: string[]; date_range: [string, string] } | null;
  notable_sales: Sale[];
  variant_sales: VariantSale[];
  computed: Computed;
  meta: { curated_by: string; curated_date: string; sources: string[]; build_date: string };
}

export interface ContextSource { name: string; url?: string }
export interface ContextIndex { id: string; label: string; low_pct: number; high_pct: number; window: string; sources: ContextSource[] }
export interface ContextFact { id: string; label: string; value: string; detail: string; sources: ContextSource[] }
/** Named third-party figures republished as context with attribution. This layer is
 *  compiled reporting — it never feeds the register's own computed metrics. */
export interface MarketContext {
  as_of: string; compiled: string; limitation: string;
  indices: ContextIndex[]; facts: ContextFact[];
  band_framework: { label: string; source: string; bands: { band: string; min_usd: number; note: string }[] };
}

export interface Dataset { built: string; count: number; methodology_version: number; market_context: MarketContext; cards: Card[] }

export const TIER_LABEL: Record<Card['identity']['tier'], string> = {
  trinity: 'Holy Trinity', crown: 'Crown & Court', haute: 'Haute & Independent',
  core: 'Core Luxury', attainable: 'Attainable',
};
export const TIER_ORDER: Card['identity']['tier'][] = ['trinity', 'crown', 'haute', 'core', 'attainable'];

// Where the brand is headquartered / has its deepest cultural roots. Editorial signal only —
// never feeds the estimator. Used to power the Asia / Europe / Americas filter on the Register.
export const BRAND_REGION: Record<string, 'asia' | 'europe' | 'americas'> = {
  // Asia
  'Casio': 'asia', 'Citizen': 'asia', 'Credor': 'asia', 'Grand Seiko': 'asia',
  'Hajime Asaoka': 'asia', 'King Seiko': 'asia', 'Kurono Tokyo': 'asia',
  'Minase': 'asia', 'Naoya Hida': 'asia', 'Seiko': 'asia',
  // Europe
  'A. Lange & Söhne': 'europe', 'Audemars Piguet': 'europe', 'Breitling': 'europe',
  'Cartier': 'europe', 'De Bethune': 'europe', 'DeWitt': 'europe', 'F.P. Journe': 'europe',
  'H. Moser & Cie': 'europe', 'IWC': 'europe', 'Jaeger-LeCoultre': 'europe',
  'Longines': 'europe', 'MB&F': 'europe', 'Omega': 'europe', 'Panerai': 'europe',
  'Patek Philippe': 'europe', 'Philippe Dufour': 'europe', 'Rexhep Rexhepi': 'europe',
  'Richard Mille': 'europe', 'TAG Heuer': 'europe', 'Tissot': 'europe',
  'Vacheron Constantin': 'europe', 'Zenith': 'europe',
  // Americas
  'Hamilton': 'americas',
};
export const REGION_ORDER: Array<'asia' | 'europe' | 'americas'> = ['asia', 'europe', 'americas'];
export const REGION_LABEL: Record<'asia' | 'europe' | 'americas', string> = {
  asia: 'Asia', europe: 'Europe', americas: 'Americas',
};

let cache: Promise<Dataset> | null = null;
export function loadDataset(): Promise<Dataset> {
  cache ??= fetch('/data.json', { signal: AbortSignal.timeout(15000) }).then((r) => {
    if (!r.ok) throw new Error(`data.json ${r.status}`);
    return r.json();
  }).then((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid dataset');
    const dataset = value as Dataset;
    if (!Array.isArray(dataset.cards) || dataset.count !== dataset.cards.length
      || !/^\d{4}-\d{2}-\d{2}$/.test(dataset.built)
      || !Array.isArray(dataset.market_context?.indices)) throw new Error('Invalid dataset structure');
    const ids = new Set<string>();
    for (const card of dataset.cards) {
      if (!card || typeof card.id !== 'string' || !/^[a-z0-9-]+$/.test(card.id) || ids.has(card.id)
        || typeof card.identity?.brand !== 'string' || !card.computed?.estimate
        || !Array.isArray(card.media) || !Array.isArray(card.provenance_events)
        || !Array.isArray(card.screen_events)) throw new Error('Invalid dossier structure');
      ids.add(card.id);
    }
    return dataset;
  }).catch((error: unknown) => {
    cache = null;
    throw error;
  });
  return cache;
}
