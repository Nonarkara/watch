import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadScreenSightings, type ScreenSnapshot } from '../lib/catalog.ts'
import { useDataset } from '../lib/dataset-context.ts'
import type { ScreenEvent, MediaAttachment } from '../lib/data.ts'

type Filter = 'all' | ScreenEvent['media_type']

// Look up the image for a sighting. Order:
// 1. The per-sighting media (typically a premiere/in-film still when licensed)
// 2. The matched card's media (a portrait of the watch itself, not in-scene)
// Returns null if neither exists, which renders an honest "no image" frame.
function imageForSighting(sighting: ScreenEvent, mediaById: Map<string, MediaAttachment[]>): MediaAttachment | null {
  // 1. Per-sighting in-film/premiere/press still (the preferred image when present)
  if (sighting.media) {
    return {
      type: 'image',
      url: sighting.media.url,
      source_url: sighting.media.source_url,
      credit: sighting.media.credit,
      license: sighting.media.license,
      rights_status: 'licensed',
      caption: sighting.media.caption,
      match: 'exact_reference',
    }
  }
  // 2. Watch portrait from the matched card
  const cardId = sighting.matched_card_ids[0]
  if (!cardId) return null
  const media = mediaById.get(cardId) ?? []
  const exact = media.find((m) => m.match === 'exact_reference')
  return exact ?? media[0] ?? null
}

export default function Screen() {
  const data = useDataset()
  const [snapshot, setSnapshot] = useState<ScreenSnapshot | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [exactOnly, setExactOnly] = useState(false)
  useEffect(() => { loadScreenSightings().then(setSnapshot) }, [])

  // Build a card_id → first media lookup once, when the dataset lands.
  const mediaById = useMemo(() => {
    if (!data) return new Map<string, MediaAttachment[]>()
    const map = new Map<string, MediaAttachment[]>()
    for (const card of data.cards) {
      if (card.media && card.media.length) map.set(card.id, card.media)
    }
    return map
  }, [data])

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
        {sightings.map((item, index) => {
          const watchMedia = imageForSighting(item, mediaById)
          const isInContext = !!item.media
          return (
            <article className={`screen-card ${index % 5 === 1 ? 'tilt-right' : index % 5 === 3 ? 'tilt-left' : ''}`} key={item.id}>
              <div className="screen-card-media">
                {watchMedia ? (
                  <a
                    href={watchMedia.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="screen-card-image-link"
                    aria-label={`Open source for the ${item.watch} image`}
                  >
                    <img src={watchMedia.url} alt={`${item.watch} — ${watchMedia.credit ?? 'reference photograph'}`} loading="lazy" className="screen-card-image" />
                    <span className="screen-card-image-credit mono">PHOTO: {watchMedia.credit?.toUpperCase() ?? 'REGISTER'} · {watchMedia.license?.toUpperCase() ?? ''}</span>
                    {isInContext && <span className="screen-card-image-tag mono">IN-CONTEXT STILL</span>}
                  </a>
                ) : (
                  <div className="screen-card-empty">
                    <span className="mono">NO IMAGE</span>
                    <span className="mono micro dim">{item.match_level === 'exact_reference' ? 'DOSSIER HAS NO LICENSED PHOTO YET' : 'FAMILY-LEVEL — NO EXACT REFERENCE TO SHOW'}</span>
                  </div>
                )}
              </div>
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
          )
        })}
      </div>

      <section className="evidence-note">
        <p className="eyebrow">WHAT THIS CAN—AND CANNOT—SAY</p>
        <p>Product-placement research supports a relationship with recognition, attitude, and purchase intention under particular conditions. That is not proof that any Rolex sighting caused a price move. A price-response number needs an exact release date and at least three comparable sales in both the twelve months before and after.</p>
        <a href="https://journals.sagepub.com/doi/pdf/10.1177/205157070902400102" target="_blank" rel="noreferrer" className="src-a">READ THE RECALL STUDY ↗</a>
      </section>
    </div>
  )
}
