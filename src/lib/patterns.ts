// Pattern screener — descriptive statistics over the published dataset, computed client-side.
// It characterizes what past outperformers share, then lists references sharing those traits
// that still sell near retail. It never ranks by expected return and never predicts a price.
import type { Card } from './data.ts'

export type CohortMode = 'measured' | 'marker'
const MIN_MEASURED = 5 // below this, a premium cohort is too thin to describe honestly

export interface Cohort { mode: CohortMode; cards: Card[]; premiumEligible: number }

const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

const constrainedSupply = (c: Card) =>
  c.identity.produced.discontinued
  || c.scarcity_public.limited_edition.is_limited
  || c.scarcity_public.waitlist_evidence_n > 0

/**
 * Measured cohort: references verifiably trading at least `minPremiumPct` over retail.
 * Marker cohort (fallback when measured is too thin): references that carry the evidence
 * markers outperformers share — verified sales on record, constrained supply, sourced
 * provenance. Labelled distinctly in the UI; it is description, never measurement.
 */
export function buildCohort(cards: Card[], minPremiumPct: number): Cohort {
  const premiumEligible = cards.filter((c) => c.computed.premium.value != null).length
  const measured = cards
    .filter((c) => (c.computed.premium.value ?? -Infinity) >= minPremiumPct)
    .sort((a, b) => b.computed.premium.value! - a.computed.premium.value!)
  if (measured.length >= MIN_MEASURED) return { mode: 'measured', cards: measured, premiumEligible }

  const marker = cards
    .filter((c) => (c.comp_summary?.n ?? 0) > 0 && constrainedSupply(c) && c.provenance_events.length > 0)
    .sort((a, b) => b.computed.collectibility.value - a.computed.collectibility.value)
  return { mode: 'marker', cards: marker, premiumEligible }
}

export interface CohortTraits {
  n: number
  discontinuedPct: number
  provenancePct: number
  limitedPct: number
  waitlistPct: number
  medianScarcity: number
  tierMix: [string, number][]
  brands: string[]
}

export function traitsOf(cohort: Card[]): CohortTraits {
  const n = cohort.length
  const pct = (k: number) => (n ? Math.round((k / n) * 100) : 0)
  const tierCounts = new Map<string, number>()
  for (const c of cohort) tierCounts.set(c.identity.tier, (tierCounts.get(c.identity.tier) ?? 0) + 1)
  return {
    n,
    discontinuedPct: pct(cohort.filter((c) => c.identity.produced.discontinued).length),
    provenancePct: pct(cohort.filter((c) => c.provenance_events.length > 0).length),
    limitedPct: pct(cohort.filter((c) => c.scarcity_public.limited_edition.is_limited).length),
    waitlistPct: pct(cohort.filter((c) => c.scarcity_public.waitlist_evidence_n > 0).length),
    medianScarcity: Math.round(median(cohort.map((c) => c.computed.scarcity.value))),
    tierMix: [...tierCounts.entries()].sort((a, b) => b[1] - a[1]),
    brands: [...new Set(cohort.map((c) => c.identity.brand))].sort(),
  }
}

export interface TraitHit { key: string; label: string; hit: boolean }
export interface TraitMatch { card: Card; hits: TraitHit[]; score: number }

export const MATCH_LIMIT = 12
const MIN_TRAITS = 2

/**
 * Candidates: not already in the cohort, and still plausibly buyable near retail —
 * in production with a published price, or measurably trading under half the threshold.
 *
 * The traits scored here are deliberately only the ones a still-buyable watch CAN share.
 * "Discontinued" is excluded: it is the cohort's defining trait and is unreachable by
 * definition for a watch you can still buy new, so scoring against it would return nothing
 * and teach the reader nothing.
 */
export function patternMatches(cards: Card[], cohort: Card[], traits: CohortTraits, minPremiumPct: number): TraitMatch[] {
  const inCohort = new Set(cohort.map((c) => c.id))
  const out: TraitMatch[] = []
  for (const c of cards) {
    if (inCohort.has(c.id)) continue
    const premium = c.computed.premium.value
    const buyable = (!c.identity.produced.discontinued && c.retail.current_msrp_usd != null)
      || (premium != null && premium < minPremiumPct / 2)
    if (!buyable) continue
    const hits: TraitHit[] = [
      { key: 'brand', label: 'Brand in cohort', hit: traits.brands.includes(c.identity.brand) },
      { key: 'tier', label: 'Tier in cohort', hit: traits.tierMix.some(([t]) => t === c.identity.tier) },
      { key: 'provenance', label: 'Sourced provenance', hit: c.provenance_events.length > 0 },
      { key: 'supply', label: 'Limited or waitlisted', hit: constrainedSupply(c) },
      { key: 'sales', label: 'Verified sales on record', hit: (c.comp_summary?.n ?? 0) > 0 },
    ]
    const score = hits.filter((h) => h.hit).length
    if (score >= MIN_TRAITS) out.push({ card: c, hits, score })
  }
  out.sort((a, b) =>
    b.score - a.score
    || b.card.computed.scarcity.value - a.card.computed.scarcity.value
    || a.card.identity.brand.localeCompare(b.card.identity.brand))
  return out.slice(0, MATCH_LIMIT)
}
