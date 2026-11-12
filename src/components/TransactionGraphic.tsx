import { usd } from '../lib/format.ts'
import type { Card } from '../lib/data.ts'

interface Props {
  card: Card
}

export default function TransactionGraphic({ card }: Props) {
  const { estimate, premium, liquidity } = card.computed
  const msrp = card.retail.current_msrp_usd ?? card.retail.msrp_history.at(-1)?.price_usd

  if (estimate.value == null || !estimate.band) {
    return (
      <div className="txn-graphic-card empty">
        <div className="txn-header">
          <h3>Settlement scenarios</h3>
        </div>
        <p className="dim">
          {estimate.value == null ? estimate.limitation : 'The estimate has no evidence band on record.'}
        </p>
      </div>
    )
  }

  const estVal = estimate.value
  const [bandMin, bandMax] = estimate.band

  // Settlement tiers
  const dealerCashMin = Math.round(estVal * 0.80)
  const dealerCashMax = Math.round(estVal * 0.85)
  const patientP2PMin = Math.round(estVal * 0.94)
  const patientP2PMax = Math.round(estVal * 0.97)

  // Max scale for graphic
  const scaleMax = Math.max(bandMax, msrp ?? 0, estVal) * 1.05
  const scaleMin = Math.min(bandMin, dealerCashMin, msrp ?? Infinity, estVal) * 0.95

  const pctOfScale = (val: number) => {
    const range = scaleMax - scaleMin
    if (range <= 0) return 50
    return Math.min(100, Math.max(0, ((val - scaleMin) / range) * 100))
  }

  return (
    <div className="txn-graphic-card">
      <div className="txn-header">
        <h3>Sales and settlement</h3>
      </div>

      <div className="spectrum-wrap" role="group" aria-label="Settlement ranges on a shared US dollar scale">
        <p className="spectrum-reading">
          <strong>Sale evidence band</strong> <span className="mono">{usd(bandMin)}–{usd(bandMax)}</span>{' '}
          <span className="dim">{estimate.n} sales used for estimate{estimate.as_of ? ` · newest ${estimate.as_of}` : ''}</span>
        </p>
        <div className="spectrum-axis" aria-hidden="true">
          <span className="spectrum-zone fair-zone" style={{ left: `${pctOfScale(bandMin)}%`, width: `${pctOfScale(bandMax) - pctOfScale(bandMin)}%` }} />
          <span className="spectrum-point" style={{ left: `${pctOfScale(estVal)}%` }} />
          {msrp != null && <span className="spectrum-point spectrum-point--retail" style={{ left: `${pctOfScale(msrp)}%` }} />}
        </div>
        <p className="spectrum-reading spectrum-key">
          <span><span aria-hidden="true">│ </span>Estimate <strong>{usd(estVal)}</strong></span>{' '}
          {msrp != null && <span><span aria-hidden="true">┆ </span>Recorded list price <strong>{usd(msrp)}</strong></span>}
        </p>
        <p className="spectrum-reading spectrum-model">
          <strong>Dealer payout scenario</strong> <span className="mono">{usd(dealerCashMin)}–{usd(dealerCashMax)}</span>{' '}
          <span className="dim">Assumes 80–85% of the estimate. Not a quote.</span>
        </p>
        <div className="spectrum-axis" aria-hidden="true">
          <span className="spectrum-zone dealer-zone" style={{ left: `${pctOfScale(dealerCashMin)}%`, width: `${pctOfScale(dealerCashMax) - pctOfScale(dealerCashMin)}%` }} />
        </div>
        <div className="spectrum-legend mono micro" aria-label="Shared US dollar scale">
          <span>{usd(Math.round(scaleMin))}</span>
          <span>{usd(Math.round((scaleMin + scaleMax) / 2))}</span>
          <span>{usd(Math.round(scaleMax))}</span>
        </div>
      </div>

      <details className="txn-scenario-details">
      <summary>Buyer and seller assumptions</summary>
      <div className="matrix-grid">
        {/* Seller's Realization Matrix */}
        <div className="matrix-col seller-col">
          <div className="matrix-title">
            <h4>Seller scenarios</h4>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Dealer payout scenario</span>
              <span className="row-val mono amber">{usd(dealerCashMin)} – {usd(dealerCashMax)}</span>
            </div>
            <p className="row-sub dim">
              80–85% of the estimate. The model does not predict fees or time to sell.
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Direct sale scenario</span>
              <span className="row-val mono good-val">{usd(patientP2PMin)} – {usd(patientP2PMax)}</span>
            </div>
            <p className="row-sub dim">
              94–97% of the estimate. An assumption, not a measured fee or sale price.
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Above the evidence band</span>
              <span className="row-val mono warn-val">&gt; {usd(bandMax)}</span>
            </div>
            <p className="row-sub dim">
              Above the high end of this estimate band; the band does not predict sale probability.
            </p>
          </div>
        </div>

        {/* Buyer's Decision Matrix */}
        <div className="matrix-col buyer-col">
          <div className="matrix-title">
            <h4>Buyer reference points</h4>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Sale evidence band</span>
              <span className="row-val mono good-val">{usd(bandMin)} – {usd(bandMax)}</span>
            </div>
            <p className="row-sub dim">
              Based on {estimate.n} verified sales{estimate.venues ? ` across ${estimate.venues} venue(s)` : ''}.
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Vs Retail Baseline</span>
              <span className="row-val mono">{premium.value != null ? `${premium.value > 0 ? '+' : ''}${premium.value}%` : 'N/A'}</span>
            </div>
            <p className="row-sub dim">
              {premium.value != null ? 'Compares the estimate with the recorded retail baseline. It does not measure what caused the difference.' : 'No MSRP comparison available.'}
            </p>
          </div>

          <div className="matrix-row">
            <div className="row-head">
              <span className="row-label">Tracked sales frequency</span>
              <span className="row-val mono amber">{liquidity.tier.toUpperCase()}</span>
            </div>
            <p className="row-sub dim">
              {liquidity.sales_per_year} tracked sales per year. This does not estimate time to sell.
            </p>
          </div>
        </div>
      </div>
      </details>
    </div>
  )
}
