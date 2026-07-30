// Pattern screener — descriptive statistics over the published dataset, computed client-side.
// This is evidence, not advice: it characterizes what past outperformers share and lists
// references that share those traits today. It never ranks by expected return.
import type { Card } from './data.ts'

export interface CohortTraits {
  n: number
  discontinuedPct: number
  provenancePct: number
  limitedPct: number
  medianScarcity: number
  tierMix: [string, number][]
  brands: string[]
}

const median = (xs: number[]) => {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function cohortOf(cards: Card[], minPremiumPct: number): Card[] {
  return cards
    .filter((c) => (c.computed.premium.value ?? -Infinity) >= minPremiumPct)
    .sort((a, b) => b.computed.premium.value! - a.computed.premium.value!)
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
    medianScarcity: Math.round(median(cohort.map((c) => c.computed.scarcity.value))),
    tierMix: [...tierCounts.entries()].sort((a, b) => b[1] - a[1]),
    brands: [...new Set(cohort.map((c) => c.identity.brand))],
  }
}

export interface TraitMatch { card: Card; hits: { key: string; label: string; hit: boolean }[]; score: number }

// Candidates: NOT already in the cohort, and still plausibly buyable near retail —
// in production with a known price, or premium below half the cohort threshold.
export function patternMatches(cards: Card[], cohort: Card[], traits: CohortTraits, minPremiumPct: number): TraitMatch[] {
  const inCohort = new Set(cohort.map((c) => c.id))
  const out: TraitMatch[] = []
  for (const c of cards) {
    if (inCohort.has(c.id)) continue
    const premium = c.computed.premium.value
    const buyable = (!c.identity.produced.discontinued && c.retail.current_msrp_usd != null)
      || (premium != null && premium < minPremiumPct / 2)
    if (!buyable) continue
    const hits = [
      { key: 'supply', label: 'Closed or constrained supply', hit: c.identity.produced.discontinued || c.scarcity_public.limited_edition.is_limited || c.scarcity_public.waitlist_evidence_n > 0 },
      { key: 'provenance', label: 'Sourced provenance events', hit: c.provenance_events.length > 0 },
      { key: 'scarcity', label: `Scarcity ≥ cohort median (${traits.medianScarcity})`, hit: c.computed.scarcity.value >= traits.medianScarcity },
      { key: 'brand', label: 'Brand present in cohort', hit: traits.brands.includes(c.identity.brand) },
      { key: 'tier', label: 'Tier present in cohort', hit: traits.tierMix.some(([t]) => t === c.identity.tier) },
    ]
    const score = hits.filter((h) => h.hit).length
    if (score >= 3) out.push({ card: c, hits, score })
  }
  return out.sort((a, b) => b.score - a.score || b.card.computed.scarcity.value - a.card.computed.scarcity.value)
}
