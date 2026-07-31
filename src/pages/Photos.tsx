import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadRolexCatalog, type RolexCatalog } from '../lib/catalog.ts'
import { usd } from '../lib/format.ts'

export default function Photos() {
  const data = useDataset()
  const [catalog, setCatalog] = useState<RolexCatalog | null>(null)
  const [query, setQuery] = useState('')
  const [collection, setCollection] = useState('all')

  useEffect(() => { loadRolexCatalog().then(setCatalog) }, [])
  const collections = useMemo(() => [...new Set(catalog?.records.map((r) => r.collection) ?? [])].sort(), [catalog])
  const records = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return (catalog?.records ?? []).filter((record) => {
      if (collection !== 'all' && record.collection !== collection) return false
      return !needle || `${record.name} ${record.reference} ${record.configuration_reference}`.toLowerCase().includes(needle)
    })
  }, [catalog, collection, query])

  return (
    <div className="photos-page">
      <Link to="/" className="crumb">← HOME</Link>
      <div className="masthead atlas-head">
        <p className="eyebrow">ROLEX OBJECT ATLAS · FIRST COHORT</p>
        <h1 className="pagetitle">Eighty ways to look at one crown.</h1>
        <p className="lede">A source-linked catalog of Rolex configurations. These pictures are tied to actual catalog pages. The displayed price is catalog context—not a sale, appraisal, or market estimate.</p>
        <div className="sticker sticker-blue">REAL SOURCES<br />NO STOCK-PHOTO THEATRE</div>
      </div>

      <div className="photo-controls">
        <input className="photo-search-input" type="search" placeholder="Reference, model, configuration…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="sel" value={collection} onChange={(e) => setCollection(e.target.value)} aria-label="Filter collection">
          <option value="all">ALL COLLECTIONS</option>
          {collections.map((name) => <option key={name}>{name}</option>)}
        </select>
        <p className="count-line mono">{records.length} OF {catalog?.count ?? 0} CATALOG RECORDS</p>
      </div>

      <div className="catalog-grid">
        {records.map((record, index) => {
          const card = data?.cards.find((item) => item.identity.brand === 'Rolex' && item.identity.reference.toUpperCase() === record.reference)
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
                <div className="catalog-actions mono micro">
                  <a href={record.source_url} target="_blank" rel="noreferrer">SOURCE ↗</a>
                  {card && <Link to={`/w/${card.id}`}>DOSSIER →</Link>}
                </div>
              </div>
            </article>
          )
        })}
      </div>
      <p className="honest atlas-note">Image credit: The Watch Pages / source catalog. Reuse licence is not asserted. We link each image to its source and will replace it with brand press, Wikimedia, owner-contributed, or licensed media as those rights are verified.</p>
    </div>
  )
}
