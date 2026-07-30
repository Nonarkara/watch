// Scarcity explainer helpers over the published dataset. These functions describe
// observed supply signals; they do not infer future prices or expected returns.
import type { Card } from './data.ts'

export const SCARCITY_TIERS = ['Grail', 'Scarce', 'Limited', 'Common'] as const
export type ScarcityTier = (typeof SCARCITY_TIERS)[number]

export interface ScarcitySummary {
  total: number
  discontinued: number
  limited: number
  waitlisted: number
  tierCounts: Record<ScarcityTier, number>
}

export function scarcitySummary(cards: Card[]): ScarcitySummary {
  return {
    total: cards.length,
    discontinued: cards.filter((c) => c.identity.produced.discontinued).length,
    limited: cards.filter((c) => c.scarcity_public.limited_edition.is_limited).length,
    waitlisted: cards.filter((c) => c.scarcity_public.waitlist_evidence_n > 0).length,
    tierCounts: Object.fromEntries(
      SCARCITY_TIERS.map((tier) => [tier, cards.filter((c) => c.computed.scarcity.tier === tier).length]),
    ) as Record<ScarcityTier, number>,
  }
}

export function cardsInScarcityTier(cards: Card[], tier: ScarcityTier): Card[] {
  return cards
    .filter((c) => c.computed.scarcity.tier === tier)
    .sort((a, b) => b.computed.scarcity.value - a.computed.scarcity.value
      || a.identity.brand.localeCompare(b.identity.brand)
      || a.identity.reference.localeCompare(b.identity.reference))
}

export function scarcityReasons(card: Card): string[] {
  const reasons: string[] = []
  if (card.identity.produced.discontinued) reasons.push('production ended')
  if (card.scarcity_public.limited_edition.is_limited) {
    const size = card.scarcity_public.limited_edition.stated_size
    reasons.push(size ? `${size.toLocaleString()}-piece edition` : 'stated limited edition')
  }
  if (card.scarcity_public.waitlist_evidence_n > 0) reasons.push('sourced waitlist evidence')
  return reasons
}
