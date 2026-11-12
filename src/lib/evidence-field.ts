import type { Card } from './data.ts'

export const EVIDENCE_CHANNELS = [
  { key: 'photo', label: 'Exact-reference photo' },
  { key: 'sales', label: 'Comparable sales' },
  { key: 'provenance', label: 'Sourced provenance' },
  { key: 'retail', label: 'Retail history' },
  { key: 'screen', label: 'Exact screen ID' },
] as const

export type EvidenceChannel = (typeof EVIDENCE_CHANNELS)[number]['key']
export type EvidenceMetric = 'scarcity' | 'collectibility'

/** Five public evidence channels. Each channel is binary so the chart cannot
 * turn record completeness into a fake quality score. */
export function evidenceChannels(card: Card): Record<EvidenceChannel, boolean> {
  return {
    photo: card.media.some(photo => photo.match === 'exact_reference'),
    sales: (card.comp_summary?.n ?? 0) > 0,
    provenance: card.provenance_events.length > 0,
    retail: card.retail.current_msrp_usd != null || card.retail.msrp_history.length > 0,
    screen: card.screen_events.length > 0,
  }
}

export function evidenceDepth(card: Card): number {
  return Object.values(evidenceChannels(card)).filter(Boolean).length
}

export function metricValue(card: Card, metric: EvidenceMetric): number | null {
  const value = card.computed[metric].value
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null
}

/** Stable spread inside an evidence-depth column. It prevents every point in
 * a column from occupying the same pixel; it does not alter the x-axis bucket. */
export function evidenceColumnOffset(id: string, width = 24): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return ((hash % 1001) / 1000 - 0.5) * width * 2
}
