export const HOLDING_PERIODS = [1, 2, 3, 10, 20] as const
export const NEUTRAL_ANNUAL_RATE = 0

export interface CollectionEstimateInput {
  id: string
  estimate: number | null | undefined
}

export interface CollectionEstimateSummary {
  count: number
  priced_count: number
  missing_ids: string[]
  known_subtotal: number
  evidence_total: number | null
  complete: boolean
}

export interface ProjectionRow {
  years: number
  value: number
  change: number
}

export function summarizeCollectionEstimates(items: CollectionEstimateInput[]): CollectionEstimateSummary {
  let pricedCount = 0
  let knownSubtotal = 0
  const missingIds: string[] = []
  for (const item of items) {
    if (Number.isFinite(item.estimate) && Number(item.estimate) > 0) {
      pricedCount += 1
      knownSubtotal += Number(item.estimate)
    } else {
      missingIds.push(item.id)
    }
  }
  const complete = items.length > 0 && missingIds.length === 0
  return {
    count: items.length,
    priced_count: pricedCount,
    missing_ids: missingIds,
    known_subtotal: knownSubtotal,
    evidence_total: complete ? knownSubtotal : null,
    complete,
  }
}

export function compoundValue(baseline: number, annualRate: number, years: number): number {
  return baseline * Math.pow(1 + annualRate / 100, years)
}

export function projectHoldingPeriods(
  baseline: number,
  annualRate: number,
  periods: readonly number[] = HOLDING_PERIODS,
): ProjectionRow[] {
  return periods.map((years) => {
    const value = compoundValue(baseline, annualRate, years)
    return { years, value, change: value - baseline }
  })
}
