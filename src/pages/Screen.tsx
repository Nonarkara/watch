import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadScreenSightings, type ScreenSnapshot } from '../lib/catalog.ts'
import { useDataset } from '../lib/dataset-context.ts'
import type { ScreenEvent, MediaAttachment } from '../lib/data.ts'

type Filter = 'all' | ScreenEvent['media_type']

type ResolvedImage = MediaAttachment & { kind: 'in_context' | 'portrait' }

function imageForSighting(sighting: ScreenEvent, mediaById: Map<string, MediaAttachment[]>): ResolvedImage | null {
  if (sighting.media) {
    return {
      type: 'image',
      url: sighting.media.url,
      source_url: sighting.media.source_url,
      credit: sighting.media.credit,
      license: sighting.media.license,
      rights_status: 'promotional_editorial',
      caption: sighting.media.caption,
      match: 'exact_reference',
      kind: 'in_context',
    }
  }
  if (sighting.suppress_portrait_fallback) return null
  const cardId = sighting.matched_card_ids[0]
  if (!cardId) return null
  const media = mediaById.get(cardId) ?? []
  const exact = media.find((m) => m.match === 'exact_reference')
  const pick = exact ?? media[0]
  if (!pick) return null
  return { ...pick, kind: 'portrait' }
}

export default function Screen() {
  const data = useDataset()
  const [snapshot, setSnapshot] = useState<ScreenSnapshot | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [exactOnly, setExactOnly] = useState(false)
  useEffect(() => { loadScreenSightings().then(setSnapshot) }, [])

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
  const withStills = snapshot?.sightings.filter((item) => item.media).length ?? 0

  // Track dossier-portrait URLs already shown so two Milgauss cards don't look like two photos.
  const seenPortraits = new Set<string>()

  return (
    <div className="screen-page">
      <Link to="/" className="crumb">← HOME</Link>
      <section className="screen-hero">
        <div>
          <p className="eyebrow">ON SCREEN · WATCHES IN FILM &amp; TV</p>
          <h1 className="pagetitle">The watch enters the scene.</h1>
          <p className="lede">
            Screen exposure can make an object familiar. It cannot make the object physically scarcer.
            We show the still, credit the studio and the editorial source, and keep uncertain IDs labeled.
          </p>
        </div>
        <div className="pop-panel screen-stat-panel">
          <span className="bubble-kicker mono">THE HONEST PLOT TWIST</span>
          <strong>{snapshot?.count ?? '—'} sightings</strong>
          <span>{withStills} with credited stills · {exact} exact Rolex reference maps · {snapshot?.iconic_stills ?? 0} iconic film icons</span>
          {snapshot?.editorial_url && (
            <a href={snapshot.editorial_url} target="_blank" rel="noreferrer" className="mono micro">
              TEDDY BALDASSARRE ROUNDUP ↗
            </a>
          )}
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
          let watchMedia = imageForSighting(item, mediaById)
          let sharedPortrait = false
          if (watchMedia?.kind === 'portrait') {
            if (seenPortraits.has(watchMedia.url)) {
              watchMedia = null
              sharedPortrait = true
            } else {
              seenPortraits.add(watchMedia.url)
            }
          }
          const isInContext = watchMedia?.kind === 'in_context'
          return (
            <article className={`screen-card ${index % 5 === 1 ? 'tilt-right' : index % 5 === 3 ? 'tilt-left' : ''}`} key={item.id}>
              <div className="screen-card-media">
                {watchMedia ? (
                  <a
                    href={watchMedia.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="screen-card-image-link"
                    aria-label={`Open image source for ${item.watch}`}
                  >
                    <img src={watchMedia.url} alt={watchMedia.caption ?? `${item.watch} — ${item.title}`} loading="lazy" className="screen-card-image" />
                    <span className="screen-card-image-credit mono">
                      {isInContext ? 'STILL' : 'WATCH PORTRAIT'} · {watchMedia.credit?.toUpperCase() ?? 'SOURCE'}
                    </span>
                    {isInContext && <span className="screen-card-image-tag mono">IN-CONTEXT</span>}
                  </a>
                ) : (
                  <div className="screen-card-empty">
                    <span className="mono">NO DISTINCT STILL</span>
                    <span className="mono micro dim">
                      {sharedPortrait || item.suppress_portrait_fallback
                        ? 'SAME REFERENCE ALREADY SHOWN — OPEN THE DOSSIER FOR THE PORTRAIT'
                        : item.match_level === 'exact_reference'
                          ? 'DOSSIER HAS NO LICENSED PHOTO YET'
                          : 'FAMILY-LEVEL — NO EXACT REFERENCE PORTRAIT'}
                    </span>
                  </div>
                )}
              </div>
              <div className="screen-card-top">
                <span className="screen-kind mono">{item.brand} · {item.media_type}</span>
                <span className={`evidence-badge ${item.identification}`}>{item.identification}</span>
              </div>
              <p className="eyebrow">{item.release_year ?? 'YEAR NOT RECORDED'}</p>
              <h2>{item.watch}</h2>
              <p>{item.description}</p>
              {watchMedia?.caption && <p className="screen-caption dim micro">{watchMedia.caption}</p>}
              {watchMedia?.license && <p className="screen-rights mono micro dim">{watchMedia.license}</p>}
              <div className="screen-match mono micro">
                {item.match_level === 'exact_reference' ? 'EXACT-REFERENCE MAP' : 'FAMILY ONLY · NOT SCORED AS SCARCITY'}
              </div>
              <div className="catalog-actions mono micro">
                <a href={item.source_url} target="_blank" rel="noreferrer">
                  {item.source_url.includes('watch-id.com') ? 'WATCH-ID ↗' : 'EDITORIAL SOURCE ↗'}
                </a>
                {(item.editorial_url || snapshot?.editorial_url) && item.source_url.includes('watch-id.com') && (
                  <a href={item.editorial_url ?? snapshot?.editorial_url} target="_blank" rel="noreferrer">TEDDY ↗</a>
                )}
                {item.matched_card_ids[0] && <Link to={`/w/${item.matched_card_ids[0]}`}>DOSSIER →</Link>}
              </div>
            </article>
          )
        })}
      </div>

      <section className="evidence-note">
        <p className="eyebrow">CREDITS &amp; LIMITS</p>
        <p>
          Promotional stills are credited to the film or series and cross-checked against
          the{' '}
          <a href={snapshot?.editorial_url ?? 'https://teddybaldassarre.com/en-int/blogs/watches/movie-watches'} target="_blank" rel="noreferrer" className="src-a">
            Teddy Baldassarre movie-watches roundup
          </a>
          . Rights stay with the studios. Rolex IDs come from Watch-ID and stay tentative or family-only until a frame locks the reference.
          A sighting is attention — not a price forecast.
        </p>
        <a href="https://journals.sagepub.com/doi/pdf/10.1177/205157070902400102" target="_blank" rel="noreferrer" className="src-a">READ THE RECALL STUDY ↗</a>
      </section>
    </div>
  )
}
