import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadScreenSightings, type ScreenSnapshot } from '../lib/catalog.ts'
import { useDataset } from '../lib/dataset-context.ts'
import type { ScreenEvent, MediaAttachment } from '../lib/data.ts'
import HeroBanner from '../components/HeroBanner.tsx'

type Filter = 'all' | ScreenEvent['media_type']

/** The GQ-Australia "Watch the Screen" gallery is the editorial reference for
 *  this list. 16 iconic pairings curated for character match (not for hype).
 *  Each entry: (num, film-year, brand, reference, watch-name, character-or-actor,
 *  editorial note, optional dossier-id to deep-link).
 *  This is the kind of list you can stand behind: it picks watch-for-character
 *  matches, not watch-for-marketing. */
interface FilmWatchRow {
  brand: string
  reference: string
  watch: string
  film: string
  year: number
  character: string
  note: string
  /** Optional deep-link to a dossier in our register when the reference maps. */
  dossierId?: string
}

const FILM_WATCHES: FilmWatchRow[] = [
  { brand: 'Rolex', reference: '6538', watch: 'Submariner (Big Crown)', film: 'Dr. No', year: 1962, character: 'Sean Connery as James Bond',
    note: 'Connery lit the dial with a lighter in Goldfinger. The Submariner proved a film watch could be plot armor.', dossierId: 'rolex-submariner-6538' },
  { brand: 'Heuer', reference: '1133B', watch: 'Monaco', film: 'Le Mans', year: 1971, character: 'Steve McQueen as Michael Delaney',
    note: 'McQueen personally requested the Monaco from Jack Heuer. Crown sits on the left so it does not dig into the wrist while racing.', dossierId: 'tagheuer-monaco-caw211p' },
  { brand: 'Omega', reference: 'Speedmaster', watch: 'Professional Moonwatch', film: 'Apollo 13', year: 1995, character: 'Kevin Bacon as Jack Swigert',
    note: 'Tom Hanks is the star, but it is Swigert\'s Speedmaster that times the engine burn that brings the crew home.', dossierId: 'omega-speedmaster' },
  { brand: 'Hamilton', reference: 'H70455533', watch: 'Khaki Field Murph', film: 'Interstellar', year: 2014, character: 'Matthew McConaughey as Joseph Cooper',
    note: 'Five years after the film, Hamilton released the prop to the public. The second hand carries "Eureka" in Morse code.', dossierId: 'hamilton-khaki-field-h70455533' },
  { brand: 'TAG Heuer', reference: 'CAW211P', watch: 'Monaco (modern)', film: 'Glass Onion', year: 2022, character: 'Daniel Craig as Benoit Blanc',
    note: 'Craig wore the modern Monaco in the Knives Out sequel. He had already shipped the Calibre 11 in No Time to Die; the Monaco is the second life of the same character.' },
  { brand: 'Omega', reference: '210.30.42.20.03.001', watch: 'Seamaster Diver 300M 007 Edition', film: 'No Time to Die', year: 2021, character: 'Daniel Craig as James Bond',
    note: 'Craig co-designed the 007 Edition: titanium case, tropical dial, broad-arrow at 6. His last Bond outing.', dossierId: 'omega-seamaster-300m' },
  { brand: 'Hamilton', reference: 'H24411732', watch: 'Khaki Navy BeLOWZERO', film: 'Tenet', year: 2020, character: 'John David Washington as The Protagonist',
    note: 'Tenet is the second Nolan film to put Hamilton on a hero wrist after Interstellar.' },
  { brand: 'Casio', reference: 'DW-5000C', watch: 'G-Shock (orig. square)', film: 'Back to the Future', year: 1985, character: 'Michael J. Fox as Marty McFly',
    note: 'Released the same year as the film. Marty wears the original square G-Shock; the brand had not yet been in U.S. stores when the prop was chosen.' },
  { brand: 'Citizen', reference: 'AT9510', watch: 'Eco-Drive Skyhawk', film: 'Top Gun: Maverick', year: 2022, character: 'Tom Cruise as Capt. Pete "Maverick" Mitchell',
    note: 'Citizen returned as the official Top Gun watch after a 36-year gap. The original 1986 Top Gun used a Seiko 7A28.' },
  { brand: 'Seiko', reference: 'SKX007', watch: 'Diver Automatic', film: 'James Bond — "Skyfall" homage / fan art', year: 2012, character: 'Seiko 007 mod (unofficial Bond)',
    note: 'The "Seiko 007" Bond homage is fan culture, not studio product placement. Listed for the watch fan reader, not for canon.' },
  { brand: 'Audemars Piguet', reference: '26420SO', watch: 'Royal Oak Offshore Chronograph', film: 'Entourage (movie)', year: 2015, character: 'Vince, E, Drama, Turtle — full cast',
    note: 'The Entourage movie is the most on-the-nose AP placement in cinema. Loud, expensive, exactly the point the film makes about its cast.' },
  { brand: 'Rolex', reference: '126710BLRO', watch: 'GMT-Master II "Pepsi"', film: 'Gone Girl', year: 2014, character: 'Ben Affleck as Nick Dunne',
    note: 'Affleck\'s "writer of some sort" wears the Pepsi. A quieter, post-Argo correction to his character\'s wage.' },
  { brand: 'Piaget', reference: 'G0A41002', watch: 'Polo FortyFive', film: 'Focus', year: 2015, character: 'Will Smith as Nicky Spurgeon',
    note: 'A deliberately un-pickable pick. The Polo is the watch that says the con man is not trying to be read.' },
  { brand: 'Bremont', reference: 'MB II / U-2', watch: 'Bremont Broadsword / U-2', film: 'Kingsman: The Secret Service', year: 2014, character: 'Taron Egerton as Eggsy — full cast',
    note: 'Native marketing so complete the film functioned as a 130-minute Mr Porter ad. The brand earned its place by being credible in the hand.' },
  { brand: 'Panerai', reference: 'PAM 305', watch: 'Luminor 1950 Submersible', film: 'Daylight / The Expendables', year: 1996 / 2010, character: 'Sylvester Stallone / Dwayne Johnson',
    note: 'Stallone wore a Luminor in Daylight and the brand found its movie-persona. The Rock in Expendables continued the casting.' },
  { brand: 'Jaeger-LeCoultre', reference: 'Q3858420', watch: 'Reverso', film: 'Batman Begins', year: 2005, character: 'Christian Bale as Bruce Wayne',
    note: 'The Reverso is the watch a man wears when he wants to be seen as a gentleman, not a soldier. Nolan picked it for the same reason.' },
]

type ResolvedImage = MediaAttachment & { kind: 'in_context' | 'portrait' }

// Studios / production companies hold the copyright on most screen stills.
// Pull a short label from the title for the "image withheld" caption.
// Title format is typically: "Brand Ref — Actor/Character — Production".
function productionLabel(sighting: ScreenEvent): string {
  const t = sighting.title ?? ''
  const parts = t.split(/\s+[—-]\s+/)
  return parts.length >= 3 ? parts.slice(2).join(' — ').trim() : t
}

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
  // Year-range filter. Default = all years. Decade buttons set min/max.
  const [yearMin, setYearMin] = useState<number | null>(null)
  const [yearMax, setYearMax] = useState<number | null>(null)
  useEffect(() => { loadScreenSightings().then(setSnapshot) }, [])

  const mediaById = useMemo(() => {
    if (!data) return new Map<string, MediaAttachment[]>()
    const map = new Map<string, MediaAttachment[]>()
    for (const card of data.cards) {
      if (card.media && card.media.length) map.set(card.id, card.media)
    }
    return map
  }, [data])

  // Decade boundaries present in the dataset, used to drive the decade chips.
  const yearRange = useMemo(() => {
    const ys = (snapshot?.sightings ?? []).map((s) => s.release_year).filter((y): y is number => y != null)
    if (!ys.length) return { min: null, max: null }
    return { min: Math.min(...ys), max: Math.max(...ys) }
  }, [snapshot])

  // Decade chips. We bucket by 10-year spans starting from yearRange.min.
  const decadeChips = useMemo(() => {
    if (yearRange.min == null) return [] as { label: string; from: number; to: number }[]
    const start = Math.floor(yearRange.min / 10) * 10
    const end = Math.floor(yearRange.max / 10) * 10
    const chips: { label: string; from: number; to: number }[] = []
    for (let y = start; y <= end; y += 10) {
      chips.push({ label: `${y}s`, from: y, to: y + 9 })
    }
    return chips
  }, [yearRange])

  const sightings = useMemo(() => (snapshot?.sightings ?? []).filter((item) => {
    if (filter !== 'all' && item.media_type !== filter) return false
    if (exactOnly && item.match_level !== 'exact_reference') return false
    if (yearMin != null && (item.release_year == null || item.release_year < yearMin)) return false
    if (yearMax != null && (item.release_year == null || item.release_year > yearMax)) return false
    return true
  }), [snapshot, filter, exactOnly, yearMin, yearMax])
  const exact = snapshot?.sightings.filter((item) => item.match_level === 'exact_reference').length ?? 0
  const withStills = snapshot?.sightings.filter((item) => item.media).length ?? 0

  // Track dossier-portrait URLs already shown so two Milgauss cards don't look like two photos.
  const seenPortraits = new Set<string>()

  const withStillsAndPortrait = snapshot?.sightings.filter((item) => {
    if (item.media) return true
    if (item.suppress_portrait_fallback) return false
    const cid = item.matched_card_ids?.[0]
    if (!cid) return false
    return mediaById.has(cid)
  }).length ?? 0

  return (
    <div className="screen-page">
      <HeroBanner
        bg="/heroes/screen.jpg"
        hue="yellow"
        size="lg"
        alt="Pop-art collage of watches, racing drivers, agents, and global travel — watches in the world of cinema"
        eyebrow="ON SCREEN · WATCHES IN FILM & TV"
        title={<>The watch enters<br />the scene.</>}
        subtitle={
          <>
            Screen exposure can make an object familiar. It cannot make the object
            physically scarcer. We show the still, credit the studio and the editorial
            source, and keep uncertain IDs labeled.
          </>
        }
        primary={{ to: '/register', label: `BROWSE ALL ${data?.count ?? 0} OBJECTS →` }}
        secondary={{ to: '#sightings', label: 'SEE THE SIGHTINGS' }}
        credit="HERO ART · POP-ART COLLAGE — WATCHES IN THE WORLD"
        meta={
          <div className="pop-panel screen-stat-panel">
            <span className="bubble-kicker mono">THE HONEST PLOT TWIST</span>
            <strong>{snapshot?.count ?? '—'} sightings</strong>
            <span>{withStills} with credited stills · {withStillsAndPortrait} with a portrait shown · {exact} exact Rolex reference maps · {snapshot?.iconic_stills ?? 0} iconic film icons</span>
            {snapshot?.editorial_url && (
              <a href={snapshot?.editorial_url} target="_blank" rel="noreferrer" className="mono micro">
                TEDDY BALDASSARRE ROUNDUP ↗
              </a>
            )}
          </div>
        }
      />

      <section className="film-watches" aria-label="Watch the screen — 16 iconic watches in film">
        <div className="section-rule" style={{ padding: '0 28px', maxWidth: 1240, margin: '0 auto' }}>
          <h2>Watch the screen.</h2>
          <span className="sticker-inline mono">16 ICONIC PAIRINGS · CURATED FOR CHARACTER</span>
        </div>
        <ol className="film-list" style={{ margin: '0 28px', maxWidth: 1240 }}>
          {FILM_WATCHES.map((row, idx) => (
            <li key={`${row.brand}-${row.reference}-${row.film}`} className="film-row">
              <span className="film-row-num mono">{String(idx + 1).padStart(2, '0')}</span>
              <div>
                <p className="film-row-eyebrow">{row.film} · {row.year} · {row.character}</p>
                <h3 className="film-row-film">
                  {row.brand} <span className="dim">·</span> {row.watch}
                </h3>
                <p className="film-row-watch">
                  Reference <strong>{row.reference}</strong> · {row.note}
                </p>
              </div>
              <div className="film-row-actions">
                {row.dossierId ? (
                  <Link to={`/w/${row.dossierId}`}>DOSSIER →</Link>
                ) : (
                  <Link to={`/register?brand=${encodeURIComponent(row.brand)}`}>SEE IN REGISTER →</Link>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="mono micro" style={{ padding: '24px 28px 0', maxWidth: 1240, margin: '0 auto', color: 'var(--dim)' }}>
          EDITORIAL REFERENCE · GQ AUSTRALIA "WATCH THE SCREEN" (FEB 2021, ANA EKSOUZIAN-CAVADAS) · CURATED TO 16 ICONIC PAIRINGS, NOT TO 16 PRODUCTION-DEAL ANNOUNCEMENTS. WATCH FOR CHARACTER, NOT FOR PLACEMENT.
        </p>
      </section>

      <section id="sightings" className="screen-sightings">
        <div className="section-rule" style={{ padding: '0 28px', maxWidth: 1240, margin: '0 auto' }}>
          <h2>By sighting.</h2>
          <span className="sticker-inline mono">{snapshot?.count ?? 0} SCREENED · {withStills} WITH CREDITED STILLS</span>
        </div>
        <p className="crumb" style={{ padding: '0 28px', maxWidth: 1240, margin: '0 auto' }}>
          <Link to="/">← HOME</Link>
        </p>

      <aside className="screen-policy" aria-label="Image policy">
        <p className="mono micro">
          STUDIO-COPYRIGHTED IN-FILM STILLS (White Lotus, Bosch, Hacks, etc.) ARE INTENTIONALLY ABSENT — NO CC LICENCE MEANS NO IMAGE. WE SHOW THE WATCH INSTEAD.
        </p>
      </aside>

      <div className="screen-controls">
        {(['all', 'film', 'television', 'other'] as Filter[]).map((value) => (
          <button className={`chip ${filter === value ? 'on' : ''}`} key={value} onClick={() => setFilter(value)}>{value.toUpperCase()}</button>
        ))}
        <button className={`chip ${exactOnly ? 'on' : ''}`} onClick={() => setExactOnly(!exactOnly)}>EXACT REFERENCE ONLY</button>
        <span className="mono micro dim">{sightings.length} SHOWN</span>
      </div>

      {decadeChips.length > 1 && (
        <div className="screen-controls screen-year-controls" role="group" aria-label="Filter by decade">
          <button
            className={`chip ${yearMin == null && yearMax == null ? 'on' : ''}`}
            onClick={() => { setYearMin(null); setYearMax(null) }}
          >ALL YEARS</button>
          {decadeChips.map((d) => {
            const active = yearMin === d.from && yearMax === d.to
            return (
              <button
                key={d.label}
                className={`chip ${active ? 'on' : ''}`}
                onClick={() => { setYearMin(d.from); setYearMax(d.to) }}
                title={`Sightings from ${d.from} to ${d.to}`}
              >{d.label.toUpperCase()}</button>
            )
          })}
        </div>
      )}

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
          const studio = productionLabel(item)
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
                    {!isInContext && <span className="screen-card-image-tag mono">IN-FILM STILL WITHHELD</span>}
                  </a>
                ) : (
                  <div className="screen-card-empty">
                    <span className="mono">IN-FILM STILL WITHHELD</span>
                    <span className="mono micro dim">
                      {sharedPortrait || item.suppress_portrait_fallback
                        ? 'SAME REFERENCE ALREADY SHOWN ABOVE — OPEN THE DOSSIER FOR THE PORTRAIT'
                        : item.match_level === 'exact_reference'
                          ? `STUDIO COPYRIGHT · ${studio.toUpperCase()} · DOSSIER HAS NO LICENSED PHOTO YET`
                          : `STUDIO COPYRIGHT · ${studio.toUpperCase()} · FAMILY-LEVEL — NOT YET IN ANY DOSSIER`}
                    </span>
                  </div>
                )}
              </div>
              {!isInContext && watchMedia && (
                <p className="screen-still-withheld-note mono micro">
                  THE IN-FILM STILL IS COPYRIGHTED BY {studio.toUpperCase()}. WE SHOW THE WATCH INSTEAD.
                </p>
              )}
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
      </section>
    </div>
  )
}
