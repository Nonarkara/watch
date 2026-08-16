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

export interface SellerFeeAssumption {
  seller_fee_pct: number | null
  seller_flat_fee_usd: number | null
}

export interface NetProjectionRow extends ProjectionRow {
  exit_fee: number
  ownership_cost: number
  net_proceeds: number
  net_change: number
  break_even_annual_rate: number
}

export interface NetSaleOutcome {
  gross_value: number
  exit_fee: number
  ownership_cost: number
  net_proceeds: number
  net_change: number
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

export function netSaleOutcome(
  grossValue: number,
  costBasis: number,
  ownershipCost: number,
  fee: SellerFeeAssumption,
): NetSaleOutcome {
  const gross = Math.max(0, Math.round(Number.isFinite(grossValue) ? grossValue : 0))
  const startingCost = Math.max(0, Math.round(Number.isFinite(costBasis) ? costBasis : 0))
  const heldCost = Math.max(0, Math.round(Number.isFinite(ownershipCost) ? ownershipCost : 0))
  const sellerFeeRate = Math.max(0, Number.isFinite(fee.seller_fee_pct) ? Number(fee.seller_fee_pct) / 100 : 0)
  const sellerFlatFee = Math.max(0, Number.isFinite(fee.seller_flat_fee_usd) ? Number(fee.seller_flat_fee_usd) : 0)
  const exitFee = Math.min(gross, Math.round(gross * sellerFeeRate + sellerFlatFee))
  const netProceeds = gross - exitFee - heldCost
  return {
    gross_value: gross,
    exit_fee: exitFee,
    ownership_cost: heldCost,
    net_proceeds: netProceeds,
    net_change: netProceeds - startingCost,
  }
}

/**
 * Apply one disclosed seller-fee schedule and one user-entered annual cost to
 * the gross compound scenario. This models arithmetic, not future demand.
 */
export function projectNetHoldingPeriods(
  marketBaseline: number,
  costBasis: number,
  annualRate: number,
  annualOwnershipCost: number,
  fee: SellerFeeAssumption,
  periods: readonly number[] = HOLDING_PERIODS,
): NetProjectionRow[] {
  const safeAnnualCost = Math.max(0, Number.isFinite(annualOwnershipCost) ? annualOwnershipCost : 0)
  const sellerFeeRate = Math.max(0, Number.isFinite(fee.seller_fee_pct) ? Number(fee.seller_fee_pct) / 100 : 0)
  const sellerFlatFee = Math.max(0, Number.isFinite(fee.seller_flat_fee_usd) ? Number(fee.seller_flat_fee_usd) : 0)
  const sellerKeeps = Math.max(0, 1 - sellerFeeRate)
  const currentMarketValue = Math.round(marketBaseline)
  const startingCost = Math.max(0, Math.round(Number.isFinite(costBasis) ? costBasis : marketBaseline))

  return projectHoldingPeriods(marketBaseline, annualRate, periods).map((row) => {
    const outcome = netSaleOutcome(row.value, startingCost, safeAnnualCost * row.years, fee)
    const requiredGross = sellerKeeps > 0
      ? (startingCost + outcome.ownership_cost + sellerFlatFee) / sellerKeeps
      : Number.POSITIVE_INFINITY
    const breakEvenAnnualRate = Number.isFinite(requiredGross) && currentMarketValue > 0
      ? (Math.pow(requiredGross / currentMarketValue, 1 / row.years) - 1) * 100
      : Number.POSITIVE_INFINITY

    return {
      ...row,
      value: outcome.gross_value,
      change: outcome.gross_value - currentMarketValue,
      exit_fee: outcome.exit_fee,
      ownership_cost: outcome.ownership_cost,
      net_proceeds: outcome.net_proceeds,
      net_change: outcome.net_change,
      break_even_annual_rate: breakEvenAnnualRate,
    }
  })
}
