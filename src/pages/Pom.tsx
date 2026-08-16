// Pom.tsx — Uncle Pom's Collection. 14 watches attributed to General
// Prawit Wongsuwan by Voice TV (CSI LA compilation, 2018-01-01). Each
// watch gets a card with: image, name, brand, ref, price, the 4-axis
// tier chips, an editorial note, and a collecting tip.
//
// A 4-axis bar chart at the top of the page shows the collection as a
// whole — how many watches score STRONG / NEUTRAL / WEAK on each axis.
// Below the chart, the 14 watch cards run in a 2-col grid (1-col on
// phones) so the page uses the width instead of leaving half of it
// blank.
//
// The page never asks how the watches were paid for. It scores what is
// public, the same way the rest of the site does.

import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import HeroBanner from '../components/HeroBanner.tsx'
import { useDataset } from '../lib/dataset-context.ts'
import { useSaved } from '../lib/saved-store.ts'
import type { Card, ContextIndex } from '../lib/data.ts'
import { POM_AGGREGATE, POM_BIO, POM_COLLECTION, type PomAxisTier, type PomWatch } from '../lib/pom.ts'
import {
  NEUTRAL_ANNUAL_RATE,
  projectHoldingPeriods,
  summarizeCollectionEstimates,
} from '../lib/value-lab.ts'

function axisClass(t: PomAxisTier): string {
  switch (t) {
    case 'STRONG': return 'score-chip score-chip--strong'
    case 'NEUTRAL': return 'score-chip score-chip--neutral'
    case 'WEAK': return 'score-chip score-chip--weak'
    default: return 'score-chip score-chip--weak'
  }
}

function formatPrice(w: PomWatch): string {
  if (w.price_thb_range) {
    const [low, high] = w.price_thb_range
    return `${(low / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M – ${(high / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M THB`
  }
  if (w.price_thb_at_publication == null) return '—'
  return `${(w.price_thb_at_publication / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M THB`
}

function money(value: number, currency: 'THB' | 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

function signedMoney(value: number, currency: 'THB' | 'USD'): string {
  return `${value >= 0 ? '+' : '−'}${money(Math.abs(value), currency)}`
}

function ProjectionTable({ baseline, annualRate, currency }: {
  baseline: number
  annualRate: number
  currency: 'THB' | 'USD'
}) {
  return (
    <div className="pom-projection-wrap">
      <table className="pom-projection-table" aria-label={`Compound value scenario at ${annualRate}% annually`}>
        <thead>
          <tr><th>Hold</th><th>Modeled value</th><th>Change from start</th></tr>
        </thead>
        <tbody>
          {projectHoldingPeriods(baseline, annualRate).map(({ years, value: projected, change }) => {
            return (
              <tr key={years}>
                <th scope="row">{years} {years === 1 ? 'year' : 'years'}</th>
                <td>{money(projected, currency)}</td>
                <td className={projected >= baseline ? 'pom-gain' : 'pom-loss'}>{signedMoney(change, currency)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function RateControl({ value, onChange, context, id }: {
  value: number
  onChange: (value: number) => void
  context: ContextIndex
  id: string
}) {
  const source = context.sources.find((item) => item.url)
  return (
    <div className="pom-rate-control">
      <div className="pom-rate-label">
        <label htmlFor={id}>Annual growth assumption</label>
        <output htmlFor={id}>{value.toFixed(1)}%</output>
      </div>
      <input id={id} type="range" min="-10" max="20" step="0.5" value={value}
        onChange={(event) => onChange(Number(event.target.value))} />
      <div className="pom-rate-presets" aria-label="Growth assumption presets">
        {[0, 5, 10].map((rate) => (
          <button type="button" key={rate} aria-pressed={value === rate} onClick={() => onChange(rate)}>{rate}%</button>
        ))}
      </div>
      <p>
        You control this assumption. For context only, {context.label} was{' '}
        <strong>+{context.low_pct}–{context.high_pct}%</strong> over {context.window} as of July 2026.
        {source?.url && <> <a href={source.url} target="_blank" rel="noreferrer">Source ↗</a></>}
        {' '}A trailing index is not a forecast for this reference.
      </p>
    </div>
  )
}

function investmentRead(card: Card): { label: string; body: string; tone: string } {
  if (card.computed.estimate.value == null) {
    return {
      label: 'NOT YET GRADEABLE',
      body: 'There is no publishable market estimate. A user-entered baseline can run the arithmetic, but it cannot turn missing sales into investment evidence.',
      tone: 'unknown',
    }
  }
  const realChange = card.computed.change_1y.real_pct
  if (realChange == null) {
    return {
      label: 'PRICEABLE, NOT FORECASTABLE',
      body: `The system can price this reference from ${card.computed.estimate.n} comparable sales, but it cannot establish a one-year real trend. Treat the projection as a scenario, not a verdict.`,
      tone: 'neutral',
    }
  }
  if (realChange > 0 && ['High', 'Medium'].includes(card.computed.resellability.tier)) {
    return {
      label: 'EVIDENCE LEANS POSITIVE',
      body: `The measured one-year real change is +${realChange}% and resellability is ${card.computed.resellability.tier.toLowerCase()}. That supports further research; it does not guarantee the next year.`,
      tone: 'positive',
    }
  }
  if (realChange > 0) {
    return {
      label: 'GAIN, THIN EXIT',
      body: `The measured one-year real change is +${realChange}%, but resellability is ${card.computed.resellability.tier.toLowerCase()}. A paper gain matters less if the watch is difficult to sell.`,
      tone: 'neutral',
    }
  }
  return {
    label: 'EVIDENCE LEANS CAUTIOUS',
    body: `The measured one-year real change is ${realChange}% and resellability is ${card.computed.resellability.tier.toLowerCase()}. On current evidence, this is a watch to love before treating it as an investment.`,
    tone: 'cautious',
  }
}

function ValueLab() {
  const data = useDataset()
  const saved = useSaved()
  const [searchParams, setSearchParams] = useSearchParams()
  const [tab, setTab] = useState<'collection' | 'saved' | 'watch'>('collection')
  const [annualRate, setAnnualRate] = useState(NEUTRAL_ANNUAL_RATE)
  const [pomBaseline, setPomBaseline] = useState(String(POM_AGGREGATE.article_value_mid_thb))
  const [savedBaseline, setSavedBaseline] = useState('')
  const [selectedId, setSelectedId] = useState('rolex-116500ln')
  const [manualWatchBaseline, setManualWatchBaseline] = useState('')

  const requestedWatchId = searchParams.get('watch')
  useEffect(() => {
    if (!data || !requestedWatchId) return
    if (data.cards.some((card) => card.id === requestedWatchId)) {
      setSelectedId(requestedWatchId)
      setManualWatchBaseline('')
    }
    setTab('watch')
    const frame = window.requestAnimationFrame(() => {
      if (window.location.hash === '#value-lab') document.getElementById('value-lab')?.scrollIntoView()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [data, requestedWatchId])

  if (!data) return null

  const byId = new Map(data.cards.map((card) => [card.id, card]))
  const exactPomCards = POM_COLLECTION
    .map((watch) => watch.dossierId ? byId.get(watch.dossierId) : null)
    .filter((card): card is Card => Boolean(card))
  const exactPomEstimates = exactPomCards.filter((card) => card.computed.estimate.value != null).length
  const estimateReady = data.cards.filter((card) => card.computed.estimate.value != null).length
  const priceAnchor = (card: Card) => card.computed.estimate.value
    ?? card.retail.current_msrp_usd
    ?? card.retail.msrp_history.at(-1)?.price_usd
    ?? null
  const aboveThousand = data.cards.filter((card) => (priceAnchor(card) ?? 0) > 1_000).length
  const withoutPriceAnchor = data.cards.filter((card) => priceAnchor(card) == null).length
  const sortedCards = [...data.cards].sort((a, b) =>
    `${a.identity.brand} ${a.identity.reference}`.localeCompare(`${b.identity.brand} ${b.identity.reference}`))
  const selectedCard = byId.get(selectedId) ?? sortedCards[0]
  const invalidRequestedWatch = requestedWatchId != null && !byId.has(requestedWatchId)
  const savedCards = saved.ids
    .map((id) => byId.get(id))
    .filter((card): card is Card => Boolean(card))
  const savedSummary = summarizeCollectionEstimates(savedCards.map((card) => ({
    id: card.id,
    estimate: card.computed.estimate.value,
  })))
  const missingSavedCards = savedSummary.missing_ids
    .map((id) => byId.get(id))
    .filter((card): card is Card => Boolean(card))
  const pricedSavedCards = savedCards.filter((card) => card.computed.estimate.value != null)
  const savedEstimateDates = pricedSavedCards
    .map((card) => card.computed.estimate.as_of)
    .filter((date): date is string => Boolean(date))
    .sort()
  const savedEstimateDateRange = savedEstimateDates.length === 0
    ? null
    : savedEstimateDates[0] === savedEstimateDates.at(-1)
      ? savedEstimateDates[0]
      : `${savedEstimateDates[0]}–${savedEstimateDates.at(-1)}`
  const savedConfidenceTiers = [...new Set(pricedSavedCards
    .map((card) => card.computed.confidence.tier)
    .filter((tier): tier is string => Boolean(tier)))].sort().join('/')
  const savedCompCount = pricedSavedCards.reduce((sum, card) => sum + card.computed.estimate.n, 0)
  const savedMaxWindowMonths = Math.max(0, ...pricedSavedCards
    .map((card) => card.computed.estimate.window_months ?? 0))
  const enteredSavedBaseline = Number(savedBaseline)
  const savedScenarioBaseline = enteredSavedBaseline > 0
    ? enteredSavedBaseline
    : savedSummary.evidence_total
  const enteredWatchBaseline = Number(manualWatchBaseline)
  const watchBaseline = enteredWatchBaseline > 0
    ? enteredWatchBaseline
    : selectedCard.computed.estimate.value
  const basketBaseline = Number(pomBaseline) > 0
    ? Number(pomBaseline)
    : POM_AGGREGATE.article_value_mid_thb
  const overallIndex = data.market_context.indices.find((item) => item.id === 'watchcharts_overall')!
  const watchIndex = data.market_context.indices.find((item) =>
    item.id === (selectedCard.identity.brand === 'Rolex' ? 'rolex_index'
      : selectedCard.identity.brand === 'Patek Philippe' ? 'patek_index' : 'watchcharts_overall')) ?? overallIndex
  const read = investmentRead(selectedCard)

  const setWatchQuery = (watchId: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (watchId) next.set('watch', watchId)
    else next.delete('watch')
    setSearchParams(next, { replace: true })
  }

  const openMode = (mode: 'collection' | 'saved' | 'watch') => {
    setTab(mode)
    setWatchQuery(mode === 'watch' ? selectedCard.id : null)
  }

  const chooseWatch = (watchId: string) => {
    setSelectedId(watchId)
    setManualWatchBaseline('')
    setTab('watch')
    setWatchQuery(watchId)
  }

  return (
    <section className="pom-lab" id="value-lab" aria-labelledby="pom-lab-title">
      <div className="pom-lab-head">
        <div>
          <p className="eyebrow">THE VALUE LAB · THE MATHEMATICS IN PUBLIC</p>
          <h2 id="pom-lab-title">What might time do to the value?</h2>
        </div>
        <p>
          Pick a starting value and an annual assumption. The lab compounds it across five holding
          periods. It never promotes an assumption into an appraisal.
        </p>
      </div>

      <div className="pom-lab-tabs" role="tablist" aria-label="Value lab mode">
        <button type="button" role="tab" aria-selected={tab === 'collection'} aria-controls="pom-collection-panel"
          onClick={() => openMode('collection')}>UNCLE POM'S 14</button>
        <button type="button" role="tab" aria-selected={tab === 'saved'} aria-controls="pom-saved-panel"
          onClick={() => openMode('saved')}>MY SAVED · {savedCards.length}</button>
        <button type="button" role="tab" aria-selected={tab === 'watch'} aria-controls="pom-watch-panel"
          onClick={() => openMode('watch')}>TRY YOUR WATCH · {data.count}</button>
      </div>

      {tab === 'collection' ? (
        <div className="pom-lab-panel" id="pom-collection-panel" role="tabpanel">
          <div className="pom-value-status">
            <div>
              <span className="mono">KNOWN 2018 ARTICLE ANCHOR</span>
              <strong>{money(POM_AGGREGATE.article_value_low_thb, 'THB')}–{money(POM_AGGREGATE.article_value_high_thb, 'THB')}</strong>
              <p>All 14 article-stated prices, with reported ranges preserved.</p>
            </div>
            <div className="pom-value-refusal">
              <span className="mono">CURRENT APPRAISED TOTAL</span>
              <strong>—</strong>
              <p>{exactPomEstimates}/{POM_AGGREGATE.count} exact references clear today’s estimate gate. The system will not pretend the 2018 price list is a 2026 valuation.</p>
            </div>
          </div>

          <div className="pom-lab-controls">
            <label className="pom-baseline-field">
              <span>Scenario starting value · THB</span>
              <input type="number" min="1" step="100000" inputMode="numeric" value={pomBaseline}
                onChange={(event) => setPomBaseline(event.target.value)} />
              <small>Prefilled with the midpoint of the 2018 article range. Replace it with a current appraisal if you have one.</small>
            </label>
            <RateControl id="pom-collection-rate" value={annualRate} onChange={setAnnualRate} context={overallIndex} />
          </div>

          <ProjectionTable baseline={basketBaseline} annualRate={annualRate} currency="THB" />
          <p className="pom-formula mono">
            VALUE AFTER t YEARS = STARTING VALUE × (1 + ANNUAL RATE)<sup>t</sup> · {money(basketBaseline, 'THB')} × (1 + {(annualRate / 100).toFixed(3)})<sup>t</sup>
          </p>
        </div>
      ) : tab === 'saved' ? (
        <div className="pom-lab-panel" id="pom-saved-panel" role="tabpanel">
          {savedCards.length === 0 ? (
            <div className="pom-saved-empty">
              <span className="mono">YOUR COLLECTION IS EMPTY</span>
              <h3>Save a few watches. Bring them back here.</h3>
              <p>Open a dossier and tap SAVE. Your set stays in this browser; the value lab reads it without an account.</p>
              <Link to="/register">CHOOSE FROM THE REGISTER →</Link>
            </div>
          ) : (
            <>
              <div className="pom-value-status">
                <div>
                  <span className="mono">PUBLISHABLE ESTIMATE COVERAGE</span>
                  <strong>{savedSummary.priced_count}/{savedSummary.count}</strong>
                  <p>Each priced watch clears the same three-comparable-sales gate as its dossier.</p>
                </div>
                <div className="pom-value-refusal">
                  <span className="mono">EVIDENCE-DERIVED COLLECTION TOTAL</span>
                  <strong>{savedSummary.evidence_total != null ? money(savedSummary.evidence_total, 'USD') : '—'}</strong>
                  <p>{savedSummary.complete
                    ? 'Every saved watch clears the gate. This is the sum of their current publishable estimates.'
                    : `${savedSummary.missing_ids.length} saved watch${savedSummary.missing_ids.length === 1 ? '' : 'es'} still need enough sales. Known priced subset: ${money(savedSummary.known_subtotal, 'USD')}; not a collection total.`}</p>
                  <small className="pom-value-source mono">{savedSummary.priced_count > 0
                    ? `SOURCE: DOSSIER ESTIMATORS · ${savedCompCount} COMPS · WINDOWS ≤${savedMaxWindowMonths}M · CONFIDENCE ${savedConfidenceTiers || 'UNKNOWN'} · COMPONENTS AS OF ${savedEstimateDateRange ?? 'UNKNOWN'}`
                    : 'SOURCE: NO SAVED REFERENCE CLEARS THE ESTIMATE GATE'}</small>
                </div>
              </div>

              <div className="pom-saved-list" aria-label="Saved collection valuation coverage">
                <div className="pom-saved-list-head mono">
                  <span>YOUR SAVED REFERENCES</span>
                  <Link to="/saved">OPEN MY SAVED →</Link>
                </div>
                {savedCards.map((card) => (
                  <Link key={card.id} to={`/w/${card.id}`} className="pom-saved-row">
                    <span>
                      <strong>{card.identity.name}</strong>
                      <small className="mono">{card.identity.brand.toUpperCase()} · {card.identity.reference}</small>
                    </span>
                    <span className="pom-saved-value mono">
                      <strong>{card.computed.estimate.value != null
                        ? money(card.computed.estimate.value, 'USD')
                        : 'NEEDS 3 COMPS'}</strong>
                      <small>{card.computed.estimate.value != null
                        ? `${card.computed.estimate.n} COMPS · ${card.computed.estimate.window_months ?? '—'}M · TIER ${card.computed.confidence.tier ?? '—'} · AS OF ${card.computed.estimate.as_of ?? '—'}`
                        : 'ESTIMATE GATE CLOSED'}</small>
                    </span>
                  </Link>
                ))}
              </div>

              {missingSavedCards.length > 0 && (
                <p className="pom-saved-gap mono">
                  MISSING ESTIMATE: {missingSavedCards.map((card) => `${card.identity.brand} ${card.identity.reference}`).join(' · ')}
                </p>
              )}

              <div className="pom-lab-controls">
                <label className="pom-baseline-field">
                  <span>Current collection value · USD</span>
                  <input type="number" min="1" step="100" inputMode="numeric" value={savedBaseline}
                    placeholder={savedSummary.evidence_total?.toString() ?? 'Enter your current appraisal total'}
                    onChange={(event) => setSavedBaseline(event.target.value)} />
                  <small>{enteredSavedBaseline > 0
                    ? 'Using your number. The system cannot verify a user-entered appraisal.'
                    : savedSummary.evidence_total != null
                      ? 'Using the sum of every saved watch’s publishable estimate until you enter your own total.'
                      : 'No total is inferred from a partial subset. Enter a current appraisal to run the arithmetic.'}</small>
                </label>
                <RateControl id="pom-saved-rate" value={annualRate} onChange={setAnnualRate} context={overallIndex} />
              </div>

              {savedScenarioBaseline != null && savedScenarioBaseline > 0 ? (
                <>
                  <ProjectionTable baseline={savedScenarioBaseline} annualRate={annualRate} currency="USD" />
                  <p className="pom-formula mono">
                    SCENARIO ONLY · {money(savedScenarioBaseline, 'USD')} × (1 + {(annualRate / 100).toFixed(3)})<sup>t</sup> · OWNERSHIP COSTS, TAX, SERVICE, CONDITION AND SELLING FEES EXCLUDED
                  </p>
                </>
              ) : (
                <p className="pom-projection-refusal">Enter a current collection value to run the scenario. The system refuses to add a priced subset to unpriced watches and call the result a total.</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="pom-lab-panel" id="pom-watch-panel" role="tabpanel">
          <div className="pom-watch-picker">
            <label htmlFor="pom-watch-select">Pick a reference in the register</label>
            <select id="pom-watch-select" value={selectedCard.id} onChange={(event) => chooseWatch(event.target.value)}>
              {sortedCards.map((card) => (
                <option value={card.id} key={card.id}>
                  {card.identity.brand} · {card.identity.reference} · {card.identity.name}{card.computed.estimate.value != null ? ' · ESTIMATE READY' : ''}
                </option>
              ))}
            </select>
            {invalidRequestedWatch && (
              <p className="pom-deep-link-note mono" role="status">
                “{requestedWatchId}” IS NOT IN THIS BUILD · SHOWING {selectedCard.identity.brand.toUpperCase()} {selectedCard.identity.reference}
              </p>
            )}
            <p className="mono">TODAY: {data.count} REFERENCES · {aboveThousand} WITH A PRICE ANCHOR ABOVE $1,000 · {estimateReady} WITH PUBLISHABLE MARKET ESTIMATES · {withoutPriceAnchor} STILL NEED A PUBLIC PRICE ANCHOR · TARGET: EVERY CITED REFERENCE ABOVE $1,000</p>
          </div>

          <div className="pom-watch-evidence">
            <div className="pom-watch-title">
              <span className="mono">{selectedCard.identity.brand} · {selectedCard.identity.reference}</span>
              <h3>{selectedCard.identity.name}</h3>
              <div className="pom-watch-actions">
                <Link to={`/w/${selectedCard.id}`}>OPEN DOSSIER →</Link>
                <Link to={`/marketplaces?watch=${encodeURIComponent(selectedCard.id)}`}>MODEL SELLING COSTS →</Link>
                <button type="button" aria-pressed={saved.has(selectedCard.id)} onClick={() => saved.toggle(selectedCard.id)}>
                  {saved.has(selectedCard.id) ? '★ IN MY SAVED' : '☆ ADD TO MY SAVED'}
                </button>
              </div>
            </div>
            <dl>
              <div><dt>Market estimate</dt><dd>{selectedCard.computed.estimate.value != null ? money(selectedCard.computed.estimate.value, 'USD') : '—'}</dd></div>
              <div><dt>Estimate band</dt><dd>{selectedCard.computed.estimate.band ? `${money(selectedCard.computed.estimate.band[0], 'USD')}–${money(selectedCard.computed.estimate.band[1], 'USD')}` : '—'}</dd></div>
              <div><dt>Comparable sales</dt><dd>{selectedCard.computed.estimate.n || '—'}</dd></div>
              <div><dt>Confidence</dt><dd>{selectedCard.computed.confidence.tier ?? '—'}</dd></div>
              <div><dt>1y real change</dt><dd>{selectedCard.computed.change_1y.real_pct != null ? `${selectedCard.computed.change_1y.real_pct > 0 ? '+' : ''}${selectedCard.computed.change_1y.real_pct}%` : '—'}</dd></div>
              <div><dt>Resellability</dt><dd>{selectedCard.computed.resellability.tier}</dd></div>
            </dl>
          </div>

          <div className="pom-investment-read" data-tone={read.tone}>
            <span className="mono">GOOD OR BAD INVESTMENT?</span>
            <strong>{read.label}</strong>
            <p>{read.body}</p>
          </div>

          <div className="pom-lab-controls">
            <label className="pom-baseline-field">
              <span>Your starting value · USD</span>
              <input type="number" min="1" step="100" inputMode="numeric" value={manualWatchBaseline}
                placeholder={selectedCard.computed.estimate.value?.toString() ?? 'Enter purchase price'}
                onChange={(event) => setManualWatchBaseline(event.target.value)} />
              <small>{enteredWatchBaseline > 0 ? 'Using your number.' : selectedCard.computed.estimate.value != null
                ? `Using the ${selectedCard.computed.estimate.method?.replaceAll('_', ' ')} estimate until you enter your own value.`
                : 'No estimate exists. Enter a purchase price to run arithmetic without claiming a market valuation.'}</small>
            </label>
            <RateControl id="pom-watch-rate" value={annualRate} onChange={setAnnualRate} context={watchIndex} />
          </div>

          {watchBaseline != null && watchBaseline > 0 ? (
            <>
              <ProjectionTable baseline={watchBaseline} annualRate={annualRate} currency="USD" />
              <p className="pom-formula mono">
                SCENARIO ONLY · {money(watchBaseline, 'USD')} × (1 + {(annualRate / 100).toFixed(3)})<sup>t</sup> · OWNERSHIP COSTS, TAX, SERVICE, CONDITION AND SELLING FEES EXCLUDED
              </p>
            </>
          ) : (
            <p className="pom-projection-refusal">Enter a starting value to run the scenario. The blank is deliberate: this reference does not yet have enough comparable sales for a market estimate.</p>
          )}
        </div>
      )}
    </section>
  )
}

function AxisChip({ axis, value }: { axis: string; value: PomAxisTier }) {
  return (
    <span className={`score-axis score-axis--${axis.toLowerCase()}`}>
      <span className="score-axis-label">{axis.toUpperCase()}</span>
      <span className={axisClass(value)}>{value}</span>
    </span>
  )
}

function DistributionChart() {
  // Count watches per (axis, tier).
  const axes: Array<{ key: 'rarity' | 'demand' | 'provenance' | 'resellability'; label: string; hue: string }> = [
    { key: 'rarity', label: 'RARITY', hue: 'var(--coral)' },
    { key: 'demand', label: 'DEMAND', hue: 'var(--yellow)' },
    { key: 'provenance', label: 'STORY', hue: 'var(--navy)' },
    { key: 'resellability', label: 'RESELLABILITY', hue: 'var(--teal)' },
  ]
  const tiers: PomAxisTier[] = ['STRONG', 'NEUTRAL', 'WEAK', 'UNKNOWN']

  return (
    <div className="pom-chart" role="img" aria-label="Distribution of the 14 watches across the four axes">
      <p className="pom-chart-title">
        <span>COLLECTION DISTRIBUTION</span>
        <span className="mono">14 WATCHES × 4 AXES = 56 DATA POINTS</span>
      </p>
      <div className="pom-chart-bars">
        {axes.map((axis) => {
          const counts: Record<PomAxisTier, number> = { STRONG: 0, NEUTRAL: 0, WEAK: 0, UNKNOWN: 0 }
          for (const w of POM_COLLECTION) {
            counts[w[axis.key]]++
          }
          return (
            <div className="pom-chart-bar" key={axis.key}>
              <p className="pom-chart-axis mono" style={{ color: axis.hue }}>{axis.label}</p>
              <div className="pom-chart-track">
                {tiers.map((t) => {
                  const n = counts[t]
                  if (n === 0) return null
                  const pct = (n / 14) * 100
                  const cls = t === 'STRONG' ? 'pom-bar-strong' : t === 'NEUTRAL' ? 'pom-bar-neutral' : t === 'WEAK' ? 'pom-bar-weak' : 'pom-bar-unknown'
                  return (
                    <div key={t} className={`pom-bar ${cls}`} style={{ width: `${pct}%` }} title={`${t}: ${n} watches`}>
                      <span className="pom-bar-n">{n}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
      <div className="pom-chart-legend mono">
        <span><span className="pom-legend-swatch pom-bar-strong" /> STRONG</span>
        <span><span className="pom-legend-swatch pom-bar-neutral" /> NEUTRAL</span>
        <span><span className="pom-legend-swatch pom-bar-weak" /> WEAK</span>
      </div>
    </div>
  )
}

function WatchCard({ watch }: { watch: PomWatch }) {
  return (
    <article className="pom-card" id={`pom-${watch.position}`}>
      <div className="pom-card-image">
        <img src={watch.image} alt={`${watch.brand} ${watch.reference} — pop-art portrait`} loading="lazy" />
        <span className="pom-card-pos">{String(watch.position).padStart(2, '0')}</span>
      </div>
      <div className="pom-card-body">
        <p className="pom-card-meta mono">
          <span className="pom-card-brand">{watch.brand.toUpperCase()}</span>
          <span className="pom-card-ref">{watch.reference}</span>
        </p>
        <h3 className="pom-card-name">{watch.watch}</h3>
        <p className="pom-card-price mono">{formatPrice(watch)} · at publication</p>
        <p className="pom-card-note">{watch.note}</p>
        {watch.tip && (
          <p className="pom-card-tip">
            <span className="pom-tip-kicker">COLLECTING TIP</span>
            {watch.tip}
          </p>
        )}
        <div className="pom-card-axes">
          <AxisChip axis="rarity" value={watch.rarity} />
          <AxisChip axis="demand" value={watch.demand} />
          <AxisChip axis="provenance" value={watch.provenance} />
          <AxisChip axis="resellability" value={watch.resellability} />
        </div>
        <div className="pom-card-actions">
          {watch.dossierId
            ? <Link to={`/w/${watch.dossierId}`}>SEE THE DOSSIER →</Link>
            : <Link to={`/register?brand=${encodeURIComponent(watch.brand)}`}>SEE IN REGISTER →</Link>}
        </div>
      </div>
    </article>
  )
}

export default function Pom() {
  const strongCount = useMemo(
    () => POM_COLLECTION.filter((w) => w.rarity === 'STRONG' || w.demand === 'STRONG').length,
    [],
  )
  return (
    <div className="pom-page">
      <HeroBanner
        hue="navy"
        size="lg"
        eyebrow={`UNCLE POM'S COLLECTION · ${POM_AGGREGATE.count} WATCHES FROM A ${POM_BIO.article_date.slice(0, 4)} VOICE TV CSI-LA COMPILATION`}
        title={<>Uncle Pom's Collection.</>}
        subtitle={
          <>
            {POM_AGGREGATE.count} watches attributed to {POM_BIO.full_name}, scored on the same four axes
            every other reference on this site is scored on. We do not ask how the watches were
            paid for. We score what is in the public record.
          </>
        }
        primary={{ to: '#value-lab', label: 'TRY THE VALUE LAB' }}
        secondary={{ to: '#ledger', label: `SEE THE ${POM_AGGREGATE.count} WATCHES` }}
      />

      <p className="crumb"><Link to="/">← HOME</Link></p>

      <section className="pom-bio">
        <div className="pom-bio-text">
          <h2>A well-respected figure in Thailand. The watches are public record.</h2>
          <p>
            {POM_BIO.full_name} is a Thai public figure: a former army officer, former
            Deputy Prime Minister of Thailand, and former Minister of Defence. The
            collection below is the {POM_AGGREGATE.count} watches attributed to him by the
            CSI LA Facebook page and reported by Voice TV on {POM_BIO.article_date}.
            It is public record. The system's job is to score what is public.
          </p>
          <p>
            The happiness that you can get is the one that is in your heart. Choosing
            the right watch that represents your character is more important than
            wearing an expensive watch that people think is not you. We extend that
            to the dossier as well: a watch is a feeling, not a trophy. Whatever
            these {POM_AGGREGATE.count} watches mean to their owner, the four axes below
            tell a reader what the watch on the wrist can do — and what it cannot.
          </p>
        </div>
        <aside className="pom-bio-aside" aria-label="The collection at a glance">
          <h3>The collection, at a glance</h3>
          <dl>
            <dt>Source</dt>
            <dd>
              <a href={POM_BIO.article_url} target="_blank" rel="noreferrer">Voice TV / CSI LA</a>
              {' · '}
              {POM_BIO.article_date}
            </dd>
            <dt>Watches</dt>
            <dd>{POM_AGGREGATE.count}</dd>
            <dt>Brands</dt>
            <dd>{POM_AGGREGATE.brands}</dd>
            <dt>Strong axes</dt>
            <dd>{strongCount} of {POM_AGGREGATE.count} watches score STRONG on Rarity or Demand</dd>
            <dt>Dossiers linked</dt>
            <dd>{POM_AGGREGATE.has_dossier} in our register</dd>
          </dl>
        </aside>
      </section>

      <ValueLab />

      <DistributionChart />

      <section className="pom-ledger" id="ledger">
        <div className="pom-ledger-head">
          <h2>The 14 watches.</h2>
          <span className="sticker-inline mono">SCORED ON RARITY · DEMAND · STORY · RESELLABILITY</span>
        </div>
        <div className="pom-grid">
          {POM_COLLECTION.map((w) => <WatchCard key={`${w.position}-${w.brand}-${w.reference}`} watch={w} />)}
        </div>
        <p className="pom-meth-foot mono">
          SCORES DERIVED FROM THE 4-AXIS FRAMEWORK ON <Link to="/methodology">/METHODOLOGY</Link>.
          PRICES ARE THE ARTICLE-STATED BAHT VALUES, NOT 2026 EQUIVALENTS.
          ANY WRIST THIS WATCH IS ON CAN BE WORN; WE SCORE THE REFERENCE, NOT THE WRIST.
        </p>
      </section>
    </div>
  )
}
