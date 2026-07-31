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

export interface Computed {
  estimate: Estimate; premium: Premium; change_1y: Change; change_5y: Change;
  scarcity: IndexMetric; collectibility: IndexMetric; liquidity: Liquidity;
  confidence: Confidence; as_of_build: string;
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
  retail: { msrp_history: MsrpEntry[]; current_msrp_usd: number | null };
  scarcity_public: {
    limited_edition: { is_limited: boolean; stated_size: number | null; source_url: string | null };
    discontinued: boolean; waitlist_evidence_n: number;
  };
  provenance_events: ProvenanceEvent[];
  narrative: { story: string; collector_notes: string | null; starter_alternative: string | null };
  comp_summary: { n: number; venues: string[]; date_range: [string, string] } | null;
  notable_sales: Sale[];
  variant_sales: VariantSale[];
  computed: Computed;
  meta: { curated_by: string; curated_date: string; sources: string[]; build_date: string };
}

export interface Dataset { built: string; count: number; methodology_version: number; cards: Card[] }

export const TIER_LABEL: Record<Card['identity']['tier'], string> = {
  trinity: 'Holy Trinity', crown: 'Crown & Court', haute: 'Haute & Independent',
  core: 'Core Luxury', attainable: 'Attainable',
};
export const TIER_ORDER: Card['identity']['tier'][] = ['trinity', 'crown', 'haute', 'core', 'attainable'];

let cache: Promise<Dataset> | null = null;
export function loadDataset(): Promise<Dataset> {
  cache ??= fetch('/data.json').then((r) => {
    if (!r.ok) throw new Error(`data.json ${r.status}`);
    return r.json();
  });
  return cache;
}
