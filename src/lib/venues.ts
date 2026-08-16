import type { Card } from './data.ts'
import rawVenues from '../../data/shared/venues_global.json' with { type: 'json' }

export interface GlobalVenue {
  id: string
  name: string
  type: 'P2P Marketplace' | 'Direct Dealer / CPO' | 'Auction House' | 'Market Aggregator / Index'
  region: 'North America' | 'Europe & UK' | 'Asia & Japan' | 'Middle East' | 'Global'
  country: string
  city: string
  website_url: string
  est_listings: number
  seller_fee_pct: number
  buyer_fee_pct: number
  escrow_protection: string
  authentication_type: string
  pricing_bias: 'Dealer Wholesale (Cash Offer)' | 'Peer-to-Peer Clearing' | 'Peer-to-Peer Asking' | 'Retail CPO Premium' | 'Auction Hammer + Premium' | 'Dealer Wholesale / Retail Spread'
  valuation_multiplier: number
  description: string
}

export interface VerifiedFeeRule {
  venue_id: string
  seller_fee_pct: number | null
  seller_flat_fee_usd: number | null
  buyer_fee_pct: number | null
  buyer_flat_fee_usd: number | null
  sources: Array<{ label: string; url: string }>
  checked_date: string
  scope: string
  limitation: string
}

export interface VenueScenario {
  venue: GlobalVenue
  fee_rule: VerifiedFeeRule | null
  baseline_value: number | null
  seller_proceeds: number | null
  buyer_total: number | null
  baseline_n: number
  baseline_confidence: string | null
  baseline_as_of: string | null
  limitation: string
}

export const GLOBAL_VENUES: GlobalVenue[] = rawVenues.venues as GlobalVenue[]

// A venue enters the fee lab only after its current public fee page has been
// checked. Raw directory multipliers and unsourced fee fields are never price
// evidence and must not generate a number.
export const VERIFIED_FEE_RULES: Record<string, VerifiedFeeRule> = {
  chrono24: {
    venue_id: 'chrono24',
    seller_fee_pct: 6.5,
    seller_flat_fee_usd: null,
    buyer_fee_pct: null,
    buyer_flat_fee_usd: null,
    sources: [
      { label: 'PRIVATE SELLER FAQ', url: 'https://www.chrono24.com/info/faqs.htm' },
    ],
    checked_date: '2026-08-17',
    scope: 'PRIVATE SELLER COMMISSION',
    limitation: 'Assumes the watch sells at the dossier baseline. Chrono24 states a 6.5% private-seller commission. Shipping, insurance, tax, duties, dealer plans, and negotiated price are excluded.',
  },
  'loupe-this': {
    venue_id: 'loupe-this',
    seller_fee_pct: null,
    seller_flat_fee_usd: 500,
    buyer_fee_pct: 10,
    buyer_flat_fee_usd: null,
    sources: [
      { label: 'SELLER FEE', url: 'https://loupethis.com/submit-a-watch' },
      { label: 'BUYER FEE', url: 'https://loupethis.com/conditions-of-sale' },
    ],
    checked_date: '2026-08-17',
    scope: 'STANDARD SELLER LISTING + BUYER FEE',
    limitation: 'Assumes the dossier baseline is the hammer price. Loupe This states a $500 seller listing fee and a 10% buyer fee. Shipping, insurance, tax, duties, and reserve uncertainty are excluded.',
  },
}

function subtractSellerFees(baseline: number, rule: VerifiedFeeRule): number | null {
  if (rule.seller_fee_pct == null && rule.seller_flat_fee_usd == null) return null
  return Math.max(0, Math.round(
    baseline * (1 - (rule.seller_fee_pct ?? 0) / 100) - (rule.seller_flat_fee_usd ?? 0),
  ))
}

function addBuyerFees(baseline: number, rule: VerifiedFeeRule): number | null {
  if (rule.buyer_fee_pct == null && rule.buyer_flat_fee_usd == null) return null
  return Math.round(
    baseline * (1 + (rule.buyer_fee_pct ?? 0) / 100) + (rule.buyer_flat_fee_usd ?? 0),
  )
}

/** Apply verified fee schedules to one dossier estimate. These are scenarios, never venue quotes. */
export function getVenueScenarios(card: Card): VenueScenario[] {
  const estimate = card.computed.estimate

  return GLOBAL_VENUES.map((venue) => {
    const feeRule = VERIFIED_FEE_RULES[venue.id] ?? null
    const baseline = estimate.value

    if (!feeRule) {
      return {
        venue,
        fee_rule: null,
        baseline_value: baseline,
        seller_proceeds: null,
        buyer_total: null,
        baseline_n: estimate.n,
        baseline_confidence: card.computed.confidence.tier,
        baseline_as_of: estimate.as_of,
        limitation: 'Fee schedule not verified. Search the venue for this reference; no number is modeled.',
      }
    }

    if (baseline == null) {
      return {
        venue,
        fee_rule: feeRule,
        baseline_value: null,
        seller_proceeds: null,
        buyer_total: null,
        baseline_n: estimate.n,
        baseline_confidence: card.computed.confidence.tier,
        baseline_as_of: estimate.as_of,
        limitation: 'Fee schedule verified, but this reference has no publishable market estimate. MSRP is not a resale baseline.',
      }
    }

    return {
      venue,
      fee_rule: feeRule,
      baseline_value: baseline,
      seller_proceeds: subtractSellerFees(baseline, feeRule),
      buyer_total: addBuyerFees(baseline, feeRule),
      baseline_n: estimate.n,
      baseline_confidence: card.computed.confidence.tier,
      baseline_as_of: estimate.as_of,
      limitation: feeRule.limitation,
    }
  }).sort((a, b) => Number(Boolean(b.fee_rule)) - Number(Boolean(a.fee_rule)))
}

export function feeRuleLabel(rule: VerifiedFeeRule): string {
  const parts: string[] = []
  if (rule.seller_fee_pct != null) parts.push(`SELLER ${rule.seller_fee_pct}%`)
  if (rule.seller_flat_fee_usd != null) parts.push(`SELLER $${rule.seller_flat_fee_usd.toLocaleString()}`)
  if (rule.buyer_fee_pct != null) parts.push(`BUYER ${rule.buyer_fee_pct}%`)
  if (rule.buyer_flat_fee_usd != null) parts.push(`BUYER $${rule.buyer_flat_fee_usd.toLocaleString()}`)
  return parts.join(' · ')
}

/** Filter venues by region or type. */
export function filterVenues(venues: GlobalVenue[], region?: string, type?: string): GlobalVenue[] {
  return venues.filter((venue) => {
    if (region && region !== 'ALL' && venue.region !== region) return false
    if (type && type !== 'ALL' && venue.type !== type) return false
    return true
  })
}
