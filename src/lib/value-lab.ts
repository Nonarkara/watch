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
  break_even_gross_value: number
  break_even_annual_rate: number
}

export interface RequiredReturnSnapshot {
  years: number
  target_annual_return: number
  target_net_value: number
  break_even_gross_value: number
  break_even_annual_rate: number
  target_gross_value: number
  target_annual_rate: number
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

export function requiredGrossValueForNetTarget(
  targetNetValue: number,
  ownershipCost: number,
  fee: SellerFeeAssumption,
): number {
  const target = Math.max(0, Math.round(Number.isFinite(targetNetValue) ? targetNetValue : 0))
  const heldCost = Math.max(0, Math.round(Number.isFinite(ownershipCost) ? ownershipCost : 0))
  const sellerFeeRate = Math.max(0, Number.isFinite(fee.seller_fee_pct) ? Number(fee.seller_fee_pct) / 100 : 0)
  const sellerFlatFee = Math.max(0, Number.isFinite(fee.seller_flat_fee_usd) ? Number(fee.seller_flat_fee_usd) : 0)
  const sellerKeeps = 1 - sellerFeeRate
  if (sellerKeeps <= 0) return Number.POSITIVE_INFINITY

  let gross = Math.ceil((target + heldCost + sellerFlatFee) / sellerKeeps)
  // `netSaleOutcome` rounds displayed fees to whole dollars. Advance the gross
  // by the few cents/dollars needed so the published threshold truly clears.
  while (netSaleOutcome(gross, 0, heldCost, fee).net_proceeds < target) gross += 1
  return gross
}

function annualRateBetween(currentValue: number, futureValue: number, years: number): number {
  if (currentValue <= 0 || futureValue < 0 || years <= 0) return Number.POSITIVE_INFINITY
  return (Math.pow(futureValue / currentValue, 1 / years) - 1) * 100
}

/**
 * Reverse the scenario: calculate what the market must do to recover the
 * owner's cost, or to deliver a user-declared annual net return after the
 * selected selling fee and future ownership costs. It is arithmetic, not a
 * probability or forecast.
 */
export function requiredReturnSnapshot(
  marketBaseline: number,
  costBasis: number,
  years: number,
  targetAnnualReturn: number,
  annualOwnershipCost: number,
  fee: SellerFeeAssumption,
): RequiredReturnSnapshot {
  const safeBaseline = Math.max(0, Math.round(Number.isFinite(marketBaseline) ? marketBaseline : 0))
  const safeCostBasis = Math.max(0, Math.round(Number.isFinite(costBasis) ? costBasis : 0))
  const safeYears = Math.max(1, Math.round(Number.isFinite(years) ? years : 1))
  const safeTargetRate = Number.isFinite(targetAnnualReturn) ? targetAnnualReturn : 0
  const ownershipCost = Math.max(0, Number.isFinite(annualOwnershipCost) ? annualOwnershipCost : 0) * safeYears
  const targetNetValue = Math.max(0, Math.round(compoundValue(safeCostBasis, safeTargetRate, safeYears)))
  const breakEvenGross = requiredGrossValueForNetTarget(safeCostBasis, ownershipCost, fee)
  const targetGross = requiredGrossValueForNetTarget(targetNetValue, ownershipCost, fee)

  return {
    years: safeYears,
    target_annual_return: safeTargetRate,
    target_net_value: targetNetValue,
    break_even_gross_value: breakEvenGross,
    break_even_annual_rate: annualRateBetween(safeBaseline, breakEvenGross, safeYears),
    target_gross_value: targetGross,
    target_annual_rate: annualRateBetween(safeBaseline, targetGross, safeYears),
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
  const currentMarketValue = Math.round(marketBaseline)
  const startingCost = Math.max(0, Math.round(Number.isFinite(costBasis) ? costBasis : marketBaseline))

  return projectHoldingPeriods(marketBaseline, annualRate, periods).map((row) => {
    const outcome = netSaleOutcome(row.value, startingCost, safeAnnualCost * row.years, fee)
    const requiredGross = requiredGrossValueForNetTarget(startingCost, outcome.ownership_cost, fee)
    const breakEvenAnnualRate = annualRateBetween(currentMarketValue, requiredGross, row.years)

    return {
      ...row,
      value: outcome.gross_value,
      change: outcome.gross_value - currentMarketValue,
      exit_fee: outcome.exit_fee,
      ownership_cost: outcome.ownership_cost,
      net_proceeds: outcome.net_proceeds,
      net_change: outcome.net_change,
      break_even_gross_value: requiredGross,
      break_even_annual_rate: breakEvenAnnualRate,
    }
  })
}
