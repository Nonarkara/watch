export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const pct = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';
export const dash = '—';

export function yearsLabel(p: { start_year: number; end_year: number | null }): string {
  return p.end_year ? `${p.start_year}–${p.end_year}` : `${p.start_year}–`;
}

export const VENUE_LABEL: Record<string, string> = {
  phillips: 'Phillips', christies: "Christie's", sothebys: "Sotheby's",
  antiquorum: 'Antiquorum', bonhams: 'Bonhams', ebay: 'eBay', other_auction: 'Auction',
};

export const REASON_TEXT: Record<string, string> = {
  no_comps: 'No verified sales collected yet',
  insufficient_comps: 'Fewer than 3 verified sales',
  insufficient_comps_in_period: 'Not enough sales in the comparison window',
  no_msrp: 'No published retail price on record',
  no_cpi: 'CPI series unavailable for this window',
  stale_data: 'Most recent evidence is over a year old',
  no_screen_event: 'No documented screen appearance',
  no_reference_level_screen_evidence: 'Screen sightings name the model, not this reference',
  insufficient_event_window: 'No sales cohort either side of the event',
};

/** Reason codes are an internal enum. Anything reaching the UI without a human
 *  sentence is a bug, so warn in dev rather than printing the raw key at a reader. */
export const reasonText = (r: string | null): string => {
  if (!r) return ''
  const text = REASON_TEXT[r]
  if (text) return text
  if (import.meta.env?.DEV) console.warn(`[watch] reason code without human text: ${r}`)
  // Never print a raw enum key at a reader: fall back to something true and readable.
  return r.replace(/_/g, ' ').replace(/^\w/, (m) => m.toUpperCase())
}
