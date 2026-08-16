import type { Card } from './data.ts'

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

export interface VenueQuote {
  venue: GlobalVenue
  estimated_price: number | null
  net_seller_payout: number | null
  total_buyer_cost: number | null
  bias_label: string
}

import rawVenues from '../../data/shared/venues_global.json'

export const GLOBAL_VENUES: GlobalVenue[] = rawVenues.venues as GlobalVenue[]

/** Compute venue-specific valuation quotes for a given watch card based on its market estimate. */
export function getVenueValuations(card: Card): VenueQuote[] {
  const estVal = card.computed.estimate.value
  const msrp = card.retail.current_msrp_usd ?? card.retail.msrp_history.at(-1)?.price_usd

  return GLOBAL_VENUES.map((venue) => {
    if (estVal == null) {
      return {
        venue,
        estimated_price: msrp != null ? Math.round(msrp * venue.valuation_multiplier) : null,
        net_seller_payout: null,
        total_buyer_cost: null,
        bias_label: 'NO VERIFIED SALES (MSRP BASELINE)',
      }
    }

    const rawEst = Math.round(estVal * venue.valuation_multiplier)
    const netSeller = Math.round(rawEst * (1 - venue.seller_fee_pct / 100))
    const totalBuyer = Math.round(rawEst * (1 + venue.buyer_fee_pct / 100))

    return {
      venue,
      estimated_price: rawEst,
      net_seller_payout: netSeller,
      total_buyer_cost: totalBuyer,
      bias_label: venue.pricing_bias,
    }
  })
}

/** Filter venues by region or type */
export function filterVenues(venues: GlobalVenue[], region?: string, type?: string): GlobalVenue[] {
  return venues.filter((v) => {
    if (region && region !== 'ALL' && v.region !== region) return false
    if (type && type !== 'ALL' && v.type !== type) return false
    return true
  })
}
