import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usd, pct } from '../lib/format.ts'

export default function Economy() {
  const [purchasePrice, setPurchasePrice] = useState<number>(15000)
  const [holdingYears, setHoldingYears] = useState<number>(10)
  const [isPatientSale, setIsPatientSale] = useState<boolean>(true)

  // Financial parameters derived from paper research
  const cpiAnnual = 0.028 // 2.8% inflation
  const bankInterestAnnual = 0.035 // 3.5% bank interest
  const watchCagrAnnual = 0.075 // 7.5% watch CAGR for core scarcity icons
  const storageCostAnnual = 0.006 // 0.6% storage & insurance cost
  const haircut = isPatientSale ? 0.05 : 0.20 // 5% patient vs 20% panic haircut

  // Projections after N years
  const bankValue = purchasePrice * Math.pow(1 + bankInterestAnnual, holdingYears)
  const cpiBaseline = purchasePrice * Math.pow(1 + cpiAnnual, holdingYears)
  
  const rawWatchValue = purchasePrice * Math.pow(1 + watchCagrAnnual, holdingYears)
  const netWatchValue = (rawWatchValue * Math.pow(1 - storageCostAnnual, holdingYears)) * (1 - haircut)
  
  const netAnnualizedReturn = Math.pow(netWatchValue / purchasePrice, 1 / holdingYears) - 1

  return (
    <div className="economy-page">
      <Link to="/" className="crumb">← HOME</Link>

      <div className="masthead">
        <p className="eyebrow">RESEARCH & ECONOMIC FOUNDATIONS</p>
        <h1 className="pagetitle">The Collectible Economy</h1>
        <p className="lede">
          If you need cash in twelve months, put your money in a bank. A watch is an illiquid asset that beats currency debasement over a decade—provided you master three things: safe storage, the illiquidity tax, and your own endowment bias.
        </p>
      </div>

      {/* Interactive Holding Simulator */}
      <div className="econ-sim-card">
        <div className="sim-header">
          <h2>Interactive Holding Calculator</h2>
          <p className="sim-sub">Simulate holding physical scarcity versus leaving money in a bank savings account.</p>
        </div>

        <div className="sim-grid">
          <div className="sim-controls">
            <label className="sim-field">
              <span className="field-label">Watch Acquisition Cost (USD)</span>
              <input
                type="number"
                step="1000"
                min="1000"
                max="200000"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Math.max(1000, Number(e.target.value)))}
                className="sim-input"
              />
            </label>

            <label className="sim-field">
              <span className="field-label">Holding Horizon ({holdingYears} Years)</span>
              <input
                type="range"
                min="1"
                max="25"
                value={holdingYears}
                onChange={(e) => setHoldingYears(Number(e.target.value))}
                className="sim-slider"
              />
              <div className="slider-ticks mono micro">
                <span>1 yr</span>
                <span>5 yrs</span>
                <span>10 yrs</span>
                <span>20 yrs</span>
              </div>
            </label>

            <div className="sim-field">
              <span className="field-label">Liquidation Speed</span>
              <div className="sim-toggle-group">
                <button
                  type="button"
                  className={`sim-toggle-btn ${isPatientSale ? 'active' : ''}`}
                  onClick={() => setIsPatientSale(true)}
                >
                  Patient (60-90 Days · 5% Haircut)
                </button>
                <button
                  type="button"
                  className={`sim-toggle-btn ${!isPatientSale ? 'active' : ''}`}
                  onClick={() => setIsPatientSale(false)}
                >
                  Forced / Panic (1-3 Days · 20% Haircut)
                </button>
              </div>
            </div>
          </div>

          <div className="sim-results">
            <div className="res-box watch-res">
              <span className="res-label">Net Watch Value ({holdingYears}Y)</span>
              <span className="res-val mono">{usd(Math.round(netWatchValue))}</span>
              <span className="res-sub mono">
                NET REAL RETURN: {pct((netAnnualizedReturn - cpiAnnual) * 100)} / YR
              </span>
            </div>

            <div className="res-box bank-res">
              <span className="res-label">Bank Savings Account (3.5% APY)</span>
              <span className="res-val mono">{usd(Math.round(bankValue))}</span>
              <span className="res-sub mono">
                NET REAL RETURN: {pct((bankInterestAnnual - cpiAnnual) * 100)} / YR
              </span>
            </div>

            <div className="res-box cpi-res">
              <span className="res-label">Inflation Baseline (2.8% CPI)</span>
              <span className="res-val mono">{usd(Math.round(cpiBaseline))}</span>
              <span className="res-sub mono">PURCHASING POWER FLOOR</span>
            </div>
          </div>
        </div>

        <div className="sim-callout">
          {holdingYears <= 2 ? (
            <p className="warn-text">
              <strong>⚠️ Short-Term Risk Warning:</strong> At a {holdingYears}-year horizon, the liquidation haircut wipes out returns ({usd(Math.round(netWatchValue))} net vs {usd(Math.round(bankValue))} bank). Money needed within 24 months belongs in a bank.
            </p>
          ) : isPatientSale ? (
            <p className="good-text">
              <strong>✓ Long-Term Patient Collector:</strong> Holding for {holdingYears} years amortizes the liquidation haircut and storage fees. The watch outperforms bank savings by {usd(Math.round(netWatchValue - bankValue))} in net purchasing power.
            </p>
          ) : (
            <p className="warn-text">
              <strong>⚠️ Panic Liquidation Drag:</strong> Taking a 20% instant dealer haircut sacrifices {usd(Math.round(rawWatchValue * 0.20))} in asset value. Waiting 60 days preserves this capital.
            </p>
          )}
        </div>
      </div>

      {/* Deep Research Prose - Non-Writer Standards */}
      <div className="econ-prose-section">
        <h2>Three Laws of the Collectible Economy</h2>

        <div className="law-card">
          <div className="law-num mono">01</div>
          <div className="law-body">
            <h3>Safe Storage is Non-Negotiable</h3>
            <p>
              A stock portfolio lives on a server; a mechanical watch lives in physical space. Moisture, improper oil breakdown, and theft eat un-vaulted assets. Safe storage requires relative humidity held strictly between 45% and 55%, scheduled all-risk insurance (0.4%–0.7% of appraised value), and periodic mechanical servicing every 7 to 10 years.
            </p>
            <p>
              These overheads add up to roughly a 0.6% annual drag on capital. Collectors who ignore safe storage costs are calculating imaginary returns.
            </p>
          </div>
        </div>

        <div className="law-card">
          <div className="law-num mono">02</div>
          <div className="law-body">
            <h3>Embrace Illiquidity—Or Suffer the Haircut</h3>
            <p>
              Liquidity is the speed at which an asset turns into cash without giving up value. Collectibles are intentionally illiquid. If you need money by Friday morning, a dealer will gladly buy your Submariner—at a 15% to 25% discount below true market value.
            </p>
            <p>
              The un-hurried collector who can wait 60 to 90 days for P2P registry matching or consignment incurs only a 3% to 6% transaction fee. Patience is not just a virtue—it is an economic multiplier that preserves up to 20% of your total net worth.
            </p>
          </div>
        </div>

        <div className="law-card">
          <div className="law-num mono">03</div>
          <div className="law-body">
            <h3>Fight the Endowment Effect with Real Comps</h3>
            <p>
              Psychologists Richard Thaler and Daniel Kahneman demonstrated the <em>endowment effect</em>: people value what they own far more than what they would pay to get it. In watch markets, this turns into structural paralysis during downturns.
            </p>
            <p>
              Collectors who bought a Daytona at the $38,000 peak in 2022 stubbornly refused $26,000 market bids in 2024. They held stale listings for years because their brains anchored to what they paid. The Watch Register counters this emotional trap with an explicit 3-comp threshold and transparent data-confidence rungs: we publish verified transaction evidence, not seller hope.
            </p>
          </div>
        </div>

        <div className="econ-cta">
          <h3>Explore the Full Dataset</h3>
          <p>Read how these principles are encoded directly into our 186 reference cards and pure-function indexing pipeline.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn">VIEW THE REGISTER</Link>
            <Link to="/paper" className="btn secondary">READ WORKING PAPER</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
