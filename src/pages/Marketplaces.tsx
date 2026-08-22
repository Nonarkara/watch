import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import {
  feeRuleLabel,
  GLOBAL_VENUES,
  filterVenues,
  getVenueScenarios,
  type VenueScenario,
} from '../lib/venues.ts'
import { usd } from '../lib/format.ts'

export default function Marketplaces() {
  const data = useDataset()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const cards = useMemo(
    () => [...(data?.cards ?? [])].sort((a, b) => `${a.identity.brand} ${a.identity.name}`.localeCompare(`${b.identity.brand} ${b.identity.name}`)),
    [data],
  )

  const selectedCard = useMemo(() => cards.find((c) => c.id === selectedId), [cards, selectedId])
  const requestedWatchId = searchParams.get('watch')
  const invalidRequestedWatch = requestedWatchId != null && cards.length > 0 && !cards.some((card) => card.id === requestedWatchId)

  useEffect(() => {
    if (!requestedWatchId || !cards.some((card) => card.id === requestedWatchId)) return
    setSelectedId(requestedWatchId)
  }, [cards, requestedWatchId])

  const filteredVenues = useMemo(() => {
    let list = filterVenues(GLOBAL_VENUES, regionFilter, typeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q),
      )
    }
    return list
  }, [regionFilter, typeFilter, searchQuery])

  const venueScenarios = useMemo(() => {
    if (!selectedCard) return []
    return getVenueScenarios(selectedCard)
  }, [selectedCard])

  const scenarioMap = useMemo(() => {
    const map = new Map<string, VenueScenario>()
    venueScenarios.forEach((scenario) => map.set(scenario.venue.id, scenario))
    return map
  }, [venueScenarios])

  if (!data) return null

  const chooseWatch = (watchId: string) => {
    setSelectedId(watchId)
    const next = new URLSearchParams(searchParams)
    if (watchId) next.set('watch', watchId)
    else next.delete('watch')
    setSearchParams(next, { replace: true })
  }

  return (
    <>
      <p className="eyebrow">GLOBAL DIRECTORY & VERIFIED FEE LAB</p>
      <h1 className="pagetitle">Where watches change hands.</h1>
      <p className="lede">
        Search marketplaces, dealers, and auction houses. Fee math appears only where Time Pop has
        checked an official schedule. Every calculation starts from one dossier estimate; it is a
        scenario, not a live quote from the venue.
      </p>
      <p className="mono micro dim">DIRECTORY: {GLOBAL_VENUES.length} ENTRIES · SOURCE: TIME POP DIRECTORY · TIER WORKING · BUILD 2026-08-17 · VERIFY CURRENT TERMS WITH THE VENUE</p>

      {/* Watch Selection & Reference Valuation Bar */}
      <div className="venue-card-selector-panel">
        <div className="section-rule">
          <h2>Pick a reference to test verified fees</h2>
          <span className="mono micro dim">{cards.length} OBJECTS IN REGISTER</span>
        </div>

        <div className="selector-row">
          <select
            className="sel field"
            value={selectedId}
            onChange={(e) => chooseWatch(e.target.value)}
            aria-label="Choose a watch reference"
          >
            <option value="">CHOOSE A WATCH REFERENCE…</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identity.brand.toUpperCase()} · {c.identity.name.toUpperCase()} · {c.identity.reference}
              </option>
            ))}
          </select>
        </div>

        {invalidRequestedWatch && (
          <p className="marketplace-deep-link-note mono" role="status">
            “{requestedWatchId}” IS NOT IN THIS BUILD · CHOOSE A REFERENCE TO KEEP FEE MATH HONEST
          </p>
        )}

        {selectedCard && (
          <div className="selected-watch-banner">
            <div className="swb-info">
              <span className="eyebrow">{selectedCard.identity.brand} · {selectedCard.identity.collection}</span>
              <h3>{selectedCard.identity.name} <span className="mono">{selectedCard.identity.reference}</span></h3>
              <p className="mono micro dim">
                {selectedCard.computed.estimate.value != null
                  ? `MARKET BASELINE: ${usd(selectedCard.computed.estimate.value)} · ${selectedCard.computed.estimate.n} COMPS · TIER ${selectedCard.computed.confidence.tier ?? '—'} · AS OF ${selectedCard.computed.estimate.as_of ?? '—'}`
                  : 'NO MARKET BASELINE · FEE MATH STAYS OFF'}
              </p>
            </div>
            <div className="swb-actions">
              <Link to={`/pom?watch=${encodeURIComponent(selectedCard.id)}#value-lab`} className="btn secondary">
                MODEL HOLDING PERIODS →
              </Link>
              <Link to={`/w/${selectedCard.id}`} className="btn secondary">
                OPEN DOSSIER →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Directory Filter Controls */}
      <div className="venue-filters-bar">
        <div className="vf-search">
          <input
            type="text"
            className="inp field"
            placeholder="Search venue name, city, country..."
            aria-label="Search venues by name, city, or country"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="vf-selects">
          <select
            className="sel field mini-sel"
            aria-label="Filter by region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
          >
            <option value="ALL">ALL REGIONS</option>
            <option value="North America">NORTH AMERICA</option>
            <option value="Europe & UK">EUROPE & UK</option>
            <option value="Asia & Japan">ASIA & JAPAN</option>
            <option value="Middle East">MIDDLE EAST</option>
            <option value="Global">GLOBAL</option>
          </select>

          <select
            className="sel field mini-sel"
            aria-label="Filter by venue type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">ALL VENUE TYPES</option>
            <option value="P2P Marketplace">P2P MARKETPLACE</option>
            <option value="Direct Dealer / CPO">DIRECT DEALER / CPO</option>
            <option value="Auction House">AUCTION HOUSE</option>
            <option value="Market Aggregator / Index">AGGREGATOR / INDEX</option>
          </select>
        </div>
      </div>

      {/* Venues Grid */}
      <div className="venues-grid">
        {filteredVenues.map((v) => {
          const scenario = scenarioMap.get(v.id)
          return (
            <article key={v.id} className="venue-card">
              <div className="vc-top">
                <div>
                  <span className="eyebrow">{v.region.toUpperCase()} · {v.country.toUpperCase()} ({v.city})</span>
                  <h3>{v.name}</h3>
                </div>
                <span className="vc-type-tag mono micro">{v.type.toUpperCase()}</span>
              </div>

              {selectedCard && scenario && (
                <div className="vc-quote-box">
                  {scenario.fee_rule ? <>
                    <div className="vcq-row">
                      <span className="lab mono micro">FEE SCENARIO · NOT A QUOTE</span>
                      <span className="val mono">{scenario.baseline_value != null ? usd(scenario.baseline_value) : '—'}</span>
                    </div>
                    <div className="vcq-sub">
                      <span>Modeled seller proceeds: <strong>{scenario.seller_proceeds != null ? usd(scenario.seller_proceeds) : 'NOT MODELED'}</strong></span>
                      <span>Modeled buyer total: <strong>{scenario.buyer_total != null ? usd(scenario.buyer_total) : 'NOT MODELED'}</strong></span>
                    </div>
                    <span className="vcq-bias mono micro amber">{feeRuleLabel(scenario.fee_rule)}</span>
                    <span className="mono micro dim">{scenario.fee_rule.scope}</span>
                    <span className="mono micro dim">
                      SOURCE: OFFICIAL FEE PAGE · TIER VERIFIED · CHECKED {scenario.fee_rule.checked_date} ·{' '}
                      {scenario.fee_rule.sources.map((source, index) => <span key={source.url}>
                        {index > 0 ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>
                      </span>)}
                    </span>
                    <span className="micro dim">{scenario.limitation}</span>
                  </> : <>
                    <strong className="mono micro">FEE MATH OFF</strong>
                    <span className="micro dim">{scenario.limitation}</span>
                  </>}
                </div>
              )}

              <div className="vc-specs">
                <div className="vcs-row">
                  <dt>Venue role</dt>
                  <dd className="mono">{v.type}</dd>
                </div>
                <div className="vcs-row">
                  <dt>Fee evidence</dt>
                  <dd className="mono">{scenario?.fee_rule ? `VERIFIED · ${scenario.fee_rule.checked_date}` : 'NOT YET VERIFIED'}</dd>
                </div>
              </div>

              <div className="vc-actions">
                <a
                  href={`${v.website_url}${selectedCard ? `?q=${encodeURIComponent(`${selectedCard.identity.brand} ${selectedCard.identity.reference}`)}` : ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="src-a mono micro"
                >
                  VISIT {v.name.toUpperCase()} ↗
                </a>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
