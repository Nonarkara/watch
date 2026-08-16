import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { GLOBAL_VENUES, filterVenues, getVenueValuations } from '../lib/venues.ts'
import { usd } from '../lib/format.ts'

export default function Marketplaces() {
  const data = useDataset()
  const [selectedId, setSelectedId] = useState('')
  const [regionFilter, setRegionFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const cards = useMemo(
    () => [...(data?.cards ?? [])].sort((a, b) => `${a.identity.brand} ${a.identity.name}`.localeCompare(`${b.identity.brand} ${b.identity.name}`)),
    [data],
  )

  const selectedCard = useMemo(() => cards.find((c) => c.id === selectedId), [cards, selectedId])

  const filteredVenues = useMemo(() => {
    let list = filterVenues(GLOBAL_VENUES, regionFilter, typeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.country.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.description.toLowerCase().includes(q),
      )
    }
    return list
  }, [regionFilter, typeFilter, searchQuery])

  const venueQuotes = useMemo(() => {
    if (!selectedCard) return []
    return getVenueValuations(selectedCard)
  }, [selectedCard])

  const quoteMap = useMemo(() => {
    const map = new Map()
    venueQuotes.forEach((q) => map.set(q.venue.id, q))
    return map
  }, [venueQuotes])

  if (!data) return null

  return (
    <>
      <p className="eyebrow">GLOBAL DIRECTORY & VALUATION DATA</p>
      <h1 className="pagetitle">Global Watch Marketplaces & Trading Venues</h1>
      <p className="lede">
        An extensive directory of {GLOBAL_VENUES.length} major global platforms, auction houses, dealer networks, and grey market exchanges selling, trading, and advertising watches worldwide — complete with fee structures, authentication guarantees, and valuation baselines.
      </p>

      {/* Watch Selection & Reference Valuation Bar */}
      <div className="venue-card-selector-panel">
        <div className="section-rule">
          <h2>Select a reference to calculate venue valuations</h2>
          <span className="mono micro dim">{cards.length} OBJECTS IN REGISTER</span>
        </div>

        <div className="selector-row">
          <select
            className="sel field"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            aria-label="Choose a watch reference"
          >
            <option value="">CHOOSE A WATCH REFERENCE TO CALCULATE VENUE VALUATIONS…</option>
            {cards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.identity.brand.toUpperCase()} · {c.identity.name.toUpperCase()} · {c.identity.reference}
              </option>
            ))}
          </select>
        </div>

        {selectedCard && (
          <div className="selected-watch-banner">
            <div className="swb-info">
              <span className="eyebrow">{selectedCard.identity.brand} · {selectedCard.identity.collection}</span>
              <h3>{selectedCard.identity.name} <span className="mono">{selectedCard.identity.reference}</span></h3>
              <p className="mono micro dim">
                ESTIMATE: {selectedCard.computed.estimate.value ? usd(selectedCard.computed.estimate.value) : 'NO VERIFIED SALES'} · RETAIL: {selectedCard.retail.current_msrp_usd ? usd(selectedCard.retail.current_msrp_usd) : 'N/A'}
              </p>
            </div>
            <Link to={`/w/${selectedCard.id}`} className="btn secondary">
              OPEN DOSSIER →
            </Link>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="vf-selects">
          <select
            className="sel field mini-sel"
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
          const q = quoteMap.get(v.id)
          return (
            <article key={v.id} className="venue-card">
              <div className="vc-top">
                <div>
                  <span className="eyebrow">{v.region.toUpperCase()} · {v.country.toUpperCase()} ({v.city})</span>
                  <h3>{v.name}</h3>
                </div>
                <span className="vc-type-tag mono micro">{v.type.toUpperCase()}</span>
              </div>

              <p className="vc-desc">{v.description}</p>

              {/* Valuation Quote if watch is selected */}
              {selectedCard && q && (
                <div className="vc-quote-box">
                  <div className="vcq-row">
                    <span className="lab mono micro">ESTIMATED PRICE TAG</span>
                    <span className="val mono">{q.estimated_price ? usd(q.estimated_price) : 'N/A'}</span>
                  </div>
                  <div className="vcq-sub">
                    <span>Seller Net: <strong>{q.net_seller_payout ? usd(q.net_seller_payout) : 'N/A'}</strong></span>
                    <span>Buyer Cost: <strong>{q.total_buyer_cost ? usd(q.total_buyer_cost) : 'N/A'}</strong></span>
                  </div>
                  <span className="vcq-bias mono micro amber">{q.bias_label}</span>
                </div>
              )}

              <div className="vc-specs">
                <div className="vcs-row">
                  <dt>Active Listings</dt>
                  <dd className="mono">{v.est_listings.toLocaleString()}</dd>
                </div>
                <div className="vcs-row">
                  <dt>Seller Fee</dt>
                  <dd className="mono">{v.seller_fee_pct > 0 ? `${v.seller_fee_pct}%` : '0% (Dealer / Trade)'}</dd>
                </div>
                <div className="vcs-row">
                  <dt>Buyer Fee</dt>
                  <dd className="mono">{v.buyer_fee_pct > 0 ? `${v.buyer_fee_pct}% (Premium)` : '0%'}</dd>
                </div>
                <div className="vcs-row">
                  <dt>Authentication</dt>
                  <dd className="mono">{v.authentication_type}</dd>
                </div>
                <div className="vcs-row">
                  <dt>Escrow / Protection</dt>
                  <dd className="mono">{v.escrow_protection}</dd>
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
