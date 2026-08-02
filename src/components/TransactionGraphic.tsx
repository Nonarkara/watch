import { usd } from '../lib/format.ts'
import type { Card } from '../lib/data.ts'

interface Props {
  card: Card
}

export default function TransactionGraphic({ card }: Props) {
  const { estimate, premium, liquidity } = card.computed
  const msrp = card.retail.current_msrp_usd ?? card.retail.msrp_history.at(-1)?.price_usd

  if (estimate.value == null) {
    return (
      <div className="txn-graphic-card empty">
        <div className="txn-header">
          <h3>Transaction Settlement Intelligence</h3>
          <span className="mono micro dim">INSUFFICIENT COMPS FOR ESTIMATE</span>
        </div>
        <p className="dim">
          The register requires at least 3 verified sales to compute market clearing bands. Without sales evidence, we refuse to generate speculative buyer/seller settlement ranges.
        </p>
      </div>
    )
  }

  const estVal = estimate.value
  const bandMin = estimate.band ? estimate.band[0] : Math.round(estVal * 0.92)
  const bandMax = estimate.band ? estimate.band[1] : Math.round(estVal * 1.08)

  // Settlement tiers
  const dealerCashMin = Math.round(estVal * 0.80)
  const dealerCashMax = Math.round(estVal * 0.85)
  const patientP2PMin = Math.round(estVal * 0.94)
  const patientP2PMax = Math.round(estVal * 0.97)

  // Max scale for graphic
  const scaleMax = Math.max(bandMax, msrp || 0, estVal * 1.15) * 1.05
  const scaleMin = Math.min(dealerCashMin, msrp || Infinity) * 0.95

  const pctOfScale = (val: number) => {
    const range = scaleMax - scaleMin
    if (range <= 0) return 50
    return Math.min(100, Math.max(0, ((val - scaleMin) / range) * 100))
  }

  return (
    <div className="txn-graphic-card">
      <div className="txn-header">
        <div>
          <span className="eyebrow">BUYER & SELLER SETTLEMENT INTELLIGENCE</span>
          <h3>Probable Transaction Clearing Ranges</h3>
        </div>
        <div className="txn-liquidity-badge mono micro">
          LIQUIDITY: {liquidity.tier.toUpperCase()} ({liquidity.sales_per_year} SALES/YR)
        </div>
      </div>

      {/* Visual Spectrum Bar */}
      <div className="spectrum-wrap">
        <div className="spectrum-axis">
          {/* Dealer Wholesale Zone */}
          <div
            className="spectrum-zone dealer-zone"
            style={{
              left: `${pctOfScale(dealerCashMin)}%`,
              width: `${pctOfScale(dealerCashMax) - pctOfScale(dealerCashMin)}%`,
            }}
          >
            <span className="zone-label mono">DEALER CASH</span>
          </div>

          {/* Fair Clearing Zone */}
          <div
            className="spectrum-zone fair-zone"
            style={{
              left: `${pctOfScale(bandMin)}%`,
              width: `${pctOfScale(bandMax) - pctOfScale(bandMin)}%`,
            }}
          >
            <span className="zone-label mono">FAIR MARKET BAND</span>
          </div>

          {/* Estimate Marker Pin */}
          <div
            className="spectrum-pin"
            style={{ left: `${pctOfScale(estVal)}%` }}
          >
            <div className="pin-head"></div>
            <span className="pin-val mono">{usd(estVal)}</span>
          </div>

          {/* MSRP Marker if applicable */}
          {msrp && (
            <div
              className="spectrum-msrp-pin"
              style={{ left: `${pctOfScale(msrp)}%` }}
            >
              <div className="msrp-line"></div>
              <span className="msrp-val mono">MSRP {usd(msrp)}</span>
            </div>
          )}
        </div>

        <div className="spectrum-legend mono micro">
          <span>{usd(Math.round(scaleMin))}</span>
          <span>{usd(Math.round((scaleMin + scaleMax) / 2))}</span>
          <span>{usd(Math.round(scaleMax))}</span>
        </div>
      </div>

      {/* Buyer & Seller Dual Matrix */}
      <div className="matrix-grid">
        {/* Seller's Realization Matrix */}
        <div className="matrix-col seller-col">
          <div className="matrix-title">
            <span className="role-icon">🏷️</span>
            <h4>For Sellers: Net Realization</h4>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Instant Dealer Payout (1-3 Days)</span>
              <span className="row-val mono amber">{usd(dealerCashMin)} – {usd(dealerCashMax)}</span>
            </div>
            <p className="row-sub dim">
              Immediate wholesale cash payout. Reflects dealer 15-20% holding risk & margin.
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Patient Direct Sale (30-90 Days)</span>
              <span className="row-val mono good-val">{usd(patientP2PMin)} – {usd(patientP2PMax)}</span>
            </div>
            <p className="row-sub dim">
              Net proceeds after ~3-5% escrow/platform fee when matching a patient private collector.
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Endowment Trap Anchor</span>
              <span className="row-val mono warn-val">&gt; {usd(bandMax)}</span>
            </div>
            <p className="row-sub dim">
              Listing above this line anchors to emotional bias (WTA &gt; WTP), risking months of unsold paralysis.
            </p>
          </div>
        </div>

        {/* Buyer's Decision Matrix */}
        <div className="matrix-col buyer-col">
          <div className="matrix-title">
            <span className="role-icon">🔍</span>
            <h4>For Buyers: Acquisition Discipline</h4>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Fair Settlement Range</span>
              <span className="row-val mono good-val">{usd(bandMin)} – {usd(bandMax)}</span>
            </div>
            <p className="row-sub dim">
              Clearing range supported by {estimate.n} verified sales comps across {estimate.venues || 1} venue(s).
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Vs Retail Baseline</span>
              <span className="row-val mono">{premium.value != null ? `${premium.value > 0 ? '+' : ''}${premium.value}%` : 'N/A'}</span>
            </div>
            <p className="row-sub dim">
              {premium.value != null && premium.value > 0
                ? `Trading at a ${premium.value}% scarcity premium over retail MSRP.`
                : premium.value != null && premium.value < 0
                ? `Trading at a ${Math.abs(premium.value)}% discount below retail MSRP.`
                : 'No MSRP comparison available.'}
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Re-Liquidation Risk</span>
              <span className="row-val mono amber">{liquidity.tier.toUpperCase()}</span>
            </div>
            <p className="row-sub dim">
              {liquidity.sales_per_year >= 12
                ? 'High market velocity. Re-liquidates quickly if held for > 3 years.'
                : liquidity.sales_per_year >= 4
                ? 'Moderate velocity. Plan for a 60-90 day re-sale window.'
                : 'Low velocity / niche demand. Treat as long-term un-hurried collection.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
