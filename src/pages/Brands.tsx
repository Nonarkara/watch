import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { TIER_LABEL, type Card } from '../lib/data.ts'

type BrandGroup = {
  brand: string
  cards: Card[]
  withImage: number
  withComps: number
  withProvenance: number
  totalEvents: number
  withExactScreen: number
  tiers: Record<Card['identity']['tier'], number>
}

function groupByBrand(cards: Card[]): BrandGroup[] {
  const byBrand = new Map<string, Card[]>()
  for (const c of cards) {
    const list = byBrand.get(c.identity.brand) ?? []
    list.push(c)
    byBrand.set(c.identity.brand, list)
  }
  return [...byBrand.entries()].map(([brand, cards]) => {
    let withImage = 0, withComps = 0, withProvenance = 0, totalEvents = 0, withExactScreen = 0
    const tiers: BrandGroup['tiers'] = { trinity: 0, crown: 0, haute: 0, core: 0, attainable: 0 }
    for (const c of cards) {
      if (c.media.length > 0) withImage++
      if (c.comp_summary) withComps++
      if (c.provenance_events.length > 0) withProvenance++
      totalEvents += c.provenance_events.length
      if (c.screen_events.length > 0) withExactScreen++
      tiers[c.identity.tier]++
    }
    return { brand, cards, withImage, withComps, withProvenance, totalEvents, withExactScreen, tiers }
  })
}

const TIER_BLURB: Record<Card['identity']['tier'], string> = {
  trinity: 'The Holy Trinity — Patek Philippe, Audemars Piguet, Vacheron Constantin. Steel-sports grails and the dress-watch apex.',
  crown: 'Crown & Court — Rolex, Tudor. The most-cited luxury-steel range and the tool-watch canon.',
  haute: 'Haute & Independent — A. Lange & Söhne, F.P. Journe, JLC, MB&F, Zenith, Moser, Richard Mille, De Bethune, Rexhep Rexhepi, Philippe Dufour, H. Moser, Panerai.',
  core: 'Core Luxury — Omega, Cartier, IWC, Breitling, TAG Heuer, Grand Seiko. The mainstream luxury and watchmaking benchmarks.',
  attainable: 'Attainable — Tissot, Longines, Hamilton, Seiko, Grand Seiko (sub-tier), Casio, vintage Casio. The honest entry points.',
}

export default function Brands() {
  const data = useDataset()
  const [tierFilter, setTierFilter] = useState<'all' | Card['identity']['tier']>('all')

  const groups = useMemo(() => {
    if (!data) return []
    return groupByBrand(data.cards)
  }, [data])

  const filtered = useMemo(() => {
    if (tierFilter === 'all') return groups
    return groups.filter((g) => g.tiers[tierFilter] > 0)
  }, [groups, tierFilter])

  if (!data) return null

  return (
    <>
      <Link to="/" className="crumb">← HOME</Link>
      <section className="page-head">
        <div>
          <p className="eyebrow">DIRECTORY · {groups.length} BRANDS · {data.count} REFERENCES</p>
          <h1 className="pagetitle">A directory of brands we cover.</h1>
          <p className="lede">
            Every dossier on Time Pop belongs to a brand. This page shows what we have on file for each
            one — how many references, how much image and provenance coverage, and the most-cited
            intersection between the catalogue and the screen.
          </p>
        </div>
        <div className="pop-panel brand-stat-panel">
          <span className="bubble-kicker mono">READ THIS LIKE A LEDGER</span>
          <strong>{groups.length} brands, {data.count} references</strong>
          <span>
            {groups.filter((g) => g.withImage === g.cards.length).length} fully photographed ·
            {' '}{groups.filter((g) => g.withComps > 0).length} with sale evidence ·
            {' '}{groups.filter((g) => g.withProvenance > 0).length} with provenance
          </span>
        </div>
      </section>

      <div className="brand-tier-chips" role="group" aria-label="Filter brands by tier">
        <button className={'chip' + (tierFilter === 'all' ? ' on' : '')} onClick={() => setTierFilter('all')}>All {groups.length}</button>
        {(Object.keys(TIER_BLURB) as Card['identity']['tier'][]).map((t) => (
          <button key={t} className={'chip' + (tierFilter === t ? ' on' : '')} onClick={() => setTierFilter(t)}>
            {TIER_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="brand-list">
        {filtered.map((g) => {
          const coverage = g.cards.length === 0 ? 0 : Math.round((g.withImage / g.cards.length) * 100)
          return (
            <article key={g.brand} className="brand-row">
              <header className="brand-row-head">
                <h2>
                  <Link to={`/register?brand=${encodeURIComponent(g.brand)}`}>{g.brand}</Link>
                </h2>
                <span className="mono brand-row-count">
                  {g.cards.length} reference{g.cards.length === 1 ? '' : 's'}
                </span>
              </header>
              <div className="brand-tier-breakdown mono">
                {(['trinity', 'crown', 'haute', 'core', 'attainable'] as Card['identity']['tier'][]).map((t) => {
                  const n = g.tiers[t]
                  if (n === 0) return null
                  return (
                    <span key={t} className="brand-tier-pill">
                      <span className={`tier-dot tier-${t}`} />{TIER_LABEL[t]} · {n}
                    </span>
                  )
                })}
              </div>
              <div className="brand-stats mono">
                <div><span>Image</span><strong>{g.withImage}/{g.cards.length}</strong><span className="dim micro">({coverage}%)</span></div>
                <div><span>Comps</span><strong>{g.withComps}/{g.cards.length}</strong></div>
                <div><span>Provenance</span><strong>{g.withProvenance}/{g.cards.length}</strong><span className="dim micro">({g.totalEvents} events)</span></div>
                <div><span>Screen</span><strong>{g.withExactScreen}</strong><span className="dim micro">exact refs</span></div>
              </div>
              <div className="brand-coverage-bar" aria-hidden="true">
                <div className="brand-coverage-fill" style={{ width: `${coverage}%` }} />
              </div>
              <div className="brand-references">
                {g.cards.slice(0, 6).map((c) => (
                  <Link key={c.id} to={`/w/${c.id}`} className="brand-ref-pill">
                    {c.identity.reference}
                    <span className="dim">{c.identity.nickname ?? c.identity.name}</span>
                  </Link>
                ))}
                {g.cards.length > 6 && (
                  <Link to={`/register?brand=${encodeURIComponent(g.brand)}`} className="brand-ref-pill brand-ref-more">
                    +{g.cards.length - 6} more
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {tierFilter !== 'all' && (
        <section className="tier-glossary">
          <h2>About {TIER_LABEL[tierFilter]}</h2>
          <p>{TIER_BLURB[tierFilter]}</p>
        </section>
      )}

      {tierFilter === 'all' && (
        <section className="tier-glossary">
          <h2>About the tiers</h2>
          <p>
            The tier label is editorial, not a price tier. We assign it from the brand\'s standing in
            horological culture, not from the MSRP or the auction record. A Seiko Prospex at
            <strong> Attainable</strong> is no less of a watch than a Vacheron at <strong>Trinity</strong>;
            they answer different collector questions.
          </p>
        </section>
      )}
    </>
  )
}
