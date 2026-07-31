import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadScreenSightings, type ScreenSnapshot } from '../lib/catalog.ts'
import type { ScreenEvent } from '../lib/data.ts'

type Filter = 'all' | ScreenEvent['media_type']

export default function Screen() {
  const [snapshot, setSnapshot] = useState<ScreenSnapshot | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [exactOnly, setExactOnly] = useState(false)
  useEffect(() => { loadScreenSightings().then(setSnapshot) }, [])

  const sightings = useMemo(() => (snapshot?.sightings ?? []).filter((item) =>
    (filter === 'all' || item.media_type === filter) && (!exactOnly || item.match_level === 'exact_reference')),
  [snapshot, filter, exactOnly])
  const exact = snapshot?.sightings.filter((item) => item.match_level === 'exact_reference').length ?? 0

  return (
    <div className="screen-page">
      <Link to="/" className="crumb">← HOME</Link>
      <section className="screen-hero">
        <div>
          <p className="eyebrow">DID YOU KNOW? · ROLEX ON SCREEN</p>
          <h1 className="pagetitle">The watch enters the scene.</h1>
          <p className="lede">Screen exposure can make an object more familiar and desirable. It cannot make the object physically scarcer. We record the sighting as demand-side attention and wait for sales evidence before saying anything about price.</p>
        </div>
        <div className="fact-bubble fact-bubble-yellow">
          <span className="bubble-kicker mono">THE HONEST PLOT TWIST</span>
          <strong>{snapshot?.screen_count ?? '—'} film &amp; TV sightings</strong>
          <span>{exact} mapped to an exact register reference. The rest stay family-level facts.</span>
        </div>
      </section>

      <div className="screen-controls">
        {(['all', 'film', 'television', 'other'] as Filter[]).map((value) => (
          <button className={`chip ${filter === value ? 'on' : ''}`} key={value} onClick={() => setFilter(value)}>{value.toUpperCase()}</button>
        ))}
        <button className={`chip ${exactOnly ? 'on' : ''}`} onClick={() => setExactOnly(!exactOnly)}>EXACT REFERENCE ONLY</button>
        <span className="mono micro dim">{sightings.length} SHOWN</span>
      </div>

      <div className="screen-grid">
        {sightings.map((item, index) => (
          <article className={`screen-card ${index % 5 === 1 ? 'tilt-right' : index % 5 === 3 ? 'tilt-left' : ''}`} key={item.id}>
            <div className="screen-card-top">
              <span className="screen-kind mono">{item.media_type}</span>
              <span className={`evidence-badge ${item.identification}`}>{item.identification}</span>
            </div>
            <p className="eyebrow">{item.release_year ?? 'YEAR NOT RECORDED'}</p>
            <h2>{item.watch}</h2>
            <p>{item.description}</p>
            <div className="screen-match mono micro">
              {item.match_level === 'exact_reference' ? 'EXACT-REFERENCE MAP' : 'FAMILY ONLY · NOT SCORED'}
            </div>
            <div className="catalog-actions mono micro">
              <a href={item.source_url} target="_blank" rel="noreferrer">WATCH-ID SOURCE ↗</a>
              {item.matched_card_ids[0] && <Link to={`/w/${item.matched_card_ids[0]}`}>DOSSIER →</Link>}
            </div>
          </article>
        ))}
      </div>

      <section className="evidence-note">
        <p className="eyebrow">WHAT THIS CAN—AND CANNOT—SAY</p>
        <p>Product-placement research supports a relationship with recognition, attitude, and purchase intention under particular conditions. That is not proof that any Rolex sighting caused a price move. A price-response number needs an exact release date and at least three comparable sales in both the twelve months before and after.</p>
        <a href="https://journals.sagepub.com/doi/pdf/10.1177/205157070902400102" target="_blank" rel="noreferrer" className="src-a">READ THE RECALL STUDY ↗</a>
      </section>
    </div>
  )
}
