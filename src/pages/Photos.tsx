// /photos — the Rolex Object Atlas. A source-linked catalog of Rolex
// configurations. Each card shows the four axes a collector first wants to
// know: Rarity / Demand / Story / Resellability, with a one-line caption and
// a colored bar. The 80 records are sorted by collection; the user can also
// jump to a specific collection via the sub-tab nav.

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadRolexCatalog, type RolexCatalog } from '../lib/catalog.ts'
import { usd } from '../lib/format.ts'
import type { Card } from '../lib/data.ts'
import RolexAxesBar from '../components/RolexAxesBar.tsx'

export default function Photos() {
  const data = useDataset()
  const [catalog, setCatalog] = useState<RolexCatalog | null>(null)
  const [query, setQuery] = useState('')
  const [collection, setCollection] = useState<string>('all')

  useEffect(() => { loadRolexCatalog().then(setCatalog) }, [])
  const collections = useMemo(() => [...new Set(catalog?.records.map((r) => r.collection) ?? [])].sort(), [catalog])
  const records = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (catalog?.records ?? []).filter((record) => {
      if (collection !== 'all' && record.collection !== collection) return false
      return !needle || `${record.name} ${record.reference} ${record.configuration_reference}`.toLowerCase().includes(needle)
    })
  }, [catalog, collection, query])
  // Build a lookup once so the catalog grid doesn't run data.cards.find()
  // (O(n)) inside records.map() — that was 80 × 217 lookups per render.
  const rolexByRef = useMemo(() => {
    const m = new Map<string, Card>()
    for (const card of data?.cards ?? []) {
      if (card.identity.brand === 'Rolex') m.set(card.identity.reference.toUpperCase(), card)
    }
    return m
  }, [data])

  // Counts per collection for the sub-tabs.
  const countsByCollection = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of catalog?.records ?? []) {
      m.set(r.collection, (m.get(r.collection) ?? 0) + 1)
    }
    return m
  }, [catalog])

  return (
    <div className="photos-page">
      <Link to="/" className="crumb">← HOME</Link>
      <div className="masthead atlas-head">
        <p className="eyebrow">ROLEX OBJECT ATLAS · {catalog?.count ?? 0} CONFIGURATIONS · SOURCE-LINKED</p>
        <h1 className="pagetitle">Eighty ways to look at one crown.</h1>
        <p className="lede">
          A source-linked catalog of Rolex configurations, scored on the same
          four axes a collector first wants to know — Rarity, Demand, Story,
          Resellability. The picture ties to a real catalog page. The price is
          catalog context, not a sale or appraisal. The bars are the same
          evidence the dossier shows, recut to fit a card.
        </p>
        <div className="sticker sticker-blue">REAL SOURCES<br />NO STOCK-PHOTO THEATRE</div>
      </div>

      <nav className="rolex-subtabs" aria-label="Rolex collections">
        <button
          type="button"
          className={`rolex-subtab${collection === 'all' ? ' is-active' : ''}`}
          onClick={() => setCollection('all')}
        >
          <span className="rolex-subtab-num mono">ALL</span>
          <span className="rolex-subtab-label">{catalog?.count ?? 0}</span>
          <span className="rolex-subtab-sub">EVERY REFERENCE</span>
        </button>
        {collections.map((c) => (
          <button
            key={c}
            type="button"
            className={`rolex-subtab${collection === c ? ' is-active' : ''}`}
            onClick={() => setCollection(c)}
          >
            <span className="rolex-subtab-num mono">{(countsByCollection.get(c) ?? 0).toString().padStart(2, '0')}</span>
            <span className="rolex-subtab-label">{c.toUpperCase()}</span>
          </button>
        ))}
      </nav>

      <div className="photo-controls">
        <input className="photo-search-input" type="search" placeholder="Reference, model, configuration…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <p className="count-line mono">{records.length} OF {catalog?.count ?? 0} CATALOG RECORDS</p>
      </div>

      <div className="catalog-grid">
        {records.map((record, index) => {
          const card = rolexByRef.get(record.reference)
          return (
            <article className="catalog-card" key={record.id}>
              <a href={record.source_url} target="_blank" rel="noreferrer" className="catalog-image">
                <img src={record.image_url} alt={`${record.name}, configuration ${record.configuration_reference}`} loading="lazy" />
                <span className="catalog-no mono">{String(index + 1).padStart(2, '0')}</span>
              </a>
              <div className="catalog-copy">
                <p className="eyebrow">{record.collection}</p>
                <h2>{record.name.replace(/^Rolex /, '')}</h2>
                <p className="mono dim">{record.configuration_reference}</p>
                <p className="catalog-price">{usd(record.listed_price_usd)}</p>
                <p className="micro mono sticker-inline">CATALOG PRICE · NOT A SALE</p>
                {card && <RolexAxesBar card={card} />}
                <div className="catalog-actions mono micro">
                  <a href={record.source_url} target="_blank" rel="noreferrer">SOURCE ↗</a>
                  {card && <Link to={`/w/${card.id}`}>DOSSIER →</Link>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <p className="honest atlas-note">
        Image credit: The Watch Pages / source catalog. Reuse licence is not asserted.
        We link each image to its source and will replace it with brand press,
        Wikimedia, owner-contributed, or licensed media as those rights are verified.
        The four axes are the same evidence the dossier shows — see the
        {' '}<Link to="/glossary">glossary</Link> for what each one means.
      </p>
    </div>
  )
}
