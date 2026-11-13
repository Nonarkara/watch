import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadMarketTrends } from '../lib/catalog.ts'
import type { Card } from '../lib/data.ts'

type Vibe = 'all' | 'grail' | 'watching' | 'understated' | 'chronograph' | 'diver'

const GRAIL_TIERS = new Set(['crown', 'trinity', 'haute'])

export default function Discover() {
  const data = useDataset()
  const cards = useMemo(() => data?.cards.filter((c) => c.narrative.story) ?? [], [data])
  const [index, setIndex] = useState(() => Math.floor(Date.now() / 86_400_000))
  const [filterVibe, setFilterVibe] = useState<Vibe>('all')
  const [watchingIds, setWatchingIds] = useState<Set<string>>(new Set())
  const [watchingDate, setWatchingDate] = useState<string | null>(null)
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null)

  useEffect(() => {
    loadMarketTrends().then((snap) => {
      if (!snap?.trending) return
      setWatchingIds(new Set(snap.trending.map((row) => row.card_id)))
      setWatchingDate(snap.as_of)
    }).catch(() => {})
  }, [])

  const filteredCards = useMemo(() => {
    if (filterVibe === 'all') return cards
    if (filterVibe === 'grail') return cards.filter((c) => GRAIL_TIERS.has(c.identity.tier))
    if (filterVibe === 'watching') return cards.filter((c) => watchingIds.has(c.id))
    if (filterVibe === 'understated') return cards.filter((c) => c.identity.tier === 'attainable' || c.identity.tier === 'core')
    if (filterVibe === 'chronograph') return cards.filter((c) => c.identity.movement.type.includes('chronograph'))
    if (filterVibe === 'diver') return cards.filter((c) => c.identity.name.toLowerCase().includes('submariner') || c.identity.name.toLowerCase().includes('diver') || c.identity.name.toLowerCase().includes('seamaster'))
    return cards
  }, [cards, filterVibe, watchingIds])

  if (!data || cards.length === 0) return null

  const hasPhoto = (c: Card) => c.media.some((media) => media.match === 'exact_reference')
  const withPhoto = filteredCards.filter(hasPhoto)
  const activeCards = [...withPhoto, ...filteredCards.filter((c) => !hasPhoto(c))]
  const card = activeCards.length ? activeCards[index % activeCards.length] : null
  const photo = card?.media.find((media) => media.match === 'exact_reference' && media.url !== failedPhoto)

  const spinRoulette = () => {
    if (activeCards.length > 1) setIndex((current) => current + 1 + Math.floor(Math.random() * (activeCards.length - 1)))
  }

  return (
    <>
      <div className="discover-head">
        <div>
          <p className="eyebrow">Interactive Discovery Mode</p>
          <h1 className="pagetitle">Watch roulette.</h1>
          <p className="lede">Pick a filter, then spin for a watch and its story.</p>
        </div>
        <button type="button" className="btn" onClick={spinRoulette} disabled={activeCards.length < 2} aria-label="Spin roulette to discover a random watch">
          SPIN ROULETTE →
        </button>
      </div>

      {/* Vibe Selector Chips */}
      <div className="discover-filters" role="group" aria-label="Filter by vibe">
        <button
          className={`chip ${filterVibe === 'all' ? 'on' : ''}`}
          aria-pressed={filterVibe === 'all'}
          onClick={() => { setFilterVibe('all'); setIndex(0) }}
        >
          ANY VIBE ({cards.length})
        </button>
        <button
          className={`chip ${filterVibe === 'grail' ? 'on' : ''}`}
          aria-pressed={filterVibe === 'grail'}
          aria-label="Grails: crown, trinity and haute tiers"
          onClick={() => { setFilterVibe('grail'); setIndex(0) }}
        >
          GRAILS
        </button>
        <button
          className={`chip ${filterVibe === 'watching' ? 'on' : ''}`}
          aria-pressed={filterVibe === 'watching'}
          onClick={() => { setFilterVibe('watching'); setIndex(0) }}
          disabled={watchingIds.size === 0}
        >
          ATTENTION LIST ({watchingIds.size})
        </button>
        <button
          className={`chip ${filterVibe === 'understated' ? 'on' : ''}`}
          aria-pressed={filterVibe === 'understated'}
          onClick={() => { setFilterVibe('understated'); setIndex(0) }}
        >
          UNDERSTATED DAILY
        </button>
        <button
          className={`chip ${filterVibe === 'chronograph' ? 'on' : ''}`}
          aria-pressed={filterVibe === 'chronograph'}
          onClick={() => { setFilterVibe('chronograph'); setIndex(0) }}
        >
          CHRONOGRAPH
        </button>
        <button
          className={`chip ${filterVibe === 'diver' ? 'on' : ''}`}
          aria-pressed={filterVibe === 'diver'}
          onClick={() => { setFilterVibe('diver'); setIndex(0) }}
        >
          DIVERS
        </button>
      </div>
      {filterVibe === 'watching' && watchingDate && <p className="micro dim discover-attention-date">Snapshot: <time dateTime={watchingDate}>{watchingDate}</time> · attention, not sales</p>}

      {card ? <article className="discovery-card">
        <div className={`discovery-opening${photo ? ' discovery-opening--photo' : ''}`}>
        <header className="discovery-mast">
          <p className="eyebrow">{card.identity.brand} · {card.identity.collection}</p>
          <h2>{card.identity.name} <span className="mono">{card.identity.reference}</span></h2>
          {card.identity.nickname && <p className="mast-nick">“{card.identity.nickname}”</p>}
          <Link className="src-a discovery-open" to={`/w/${card.id}`}>OPEN DOSSIER →</Link>
          <p>{card.identity.one_liner}</p>
        </header>
        {photo ? (
          <figure className="discovery-portrait">
            <img src={photo.url} alt={`${card.identity.brand} ${card.identity.reference}`} className="photo-img"
              loading="eager" decoding="async" width={400} height={300} onError={() => setFailedPhoto(photo.url)} />
            <figcaption className="micro dim">
              <a className="src-a" href={photo.source_url} target="_blank" rel="noreferrer" aria-label="Photo source">
                {photo.credit || 'Photo source'} ↗
              </a>{photo.license && ` · ${photo.license}`}
            </figcaption>
          </figure>
        ) : null}

        </div>

        <div className="discovery-grid">
          <section>
            <p className="discover-kicker mono">01 · THE OBJECT</p>
            <h3>What are you looking at?</h3>
            <p>{card.narrative.story}</p>
            <dl className="mini-specs">
              <div><dt>Case</dt><dd>{card.identity.case.diameter_mm}mm · {card.identity.case.material}</dd></div>
              <div><dt>Movement</dt><dd>{movementLabel(card)}</dd></div>
              <div><dt>Production</dt><dd>{card.identity.produced.start_year}–{card.identity.produced.end_year ?? 'present'}</dd></div>
            </dl>
          </section>

          <section>
            <p className="discover-kicker mono">02 · THE ECONOMY</p>
            <h3>Where does scarcity come from?</h3>
            <p className="scarcity-number mono">{card.computed.scarcity.value}<span>/100</span></p>
            <p className="dim">A proxy built from {card.computed.scarcity.k_of[0]} of {card.computed.scarcity.k_of[1]} public signals — not a secret production number.</p>
            <ul className="signal-list">
              {scarcitySignals(card).map((signal) => <li key={signal}>{signal}</li>)}
            </ul>
            <Link className="src-a" to="/methodology">How the score works →</Link>
          </section>

          <section id="conversation">
            <p className="discover-kicker mono">03 · THE CONVERSATION</p>
            <h3>A question worth stealing</h3>
            <blockquote>“{conversationPrompt(card)}”</blockquote>
            <p className="dim">The useful conversation is rarely “will it go up?” It is what this object reveals about value, taste, technology, or memory.</p>
            {card.provenance_events[0] && (
              <p className="conversation-fact"><span className="mono micro dim">A FACT TO BRING</span><br />{card.provenance_events[0].description}</p>
            )}
          </section>
        </div>

        <footer className="discovery-foot">
          <span className="mono micro dim">{(card.meta.sources ?? []).length} SOURCES · {(card.provenance_events ?? []).length} SOURCED EVENTS</span>
          <div className="discovery-actions">
            <button type="button" className="btn" onClick={spinRoulette} disabled={activeCards.length < 2} aria-label="Spin roulette again">SPIN AGAIN →</button>
          </div>
        </footer>
      </article> : <p className="discover-empty" role="status">No references match this filter. Choose another to keep exploring.</p>}
    </>
  )
}

// Don't render `caliber · type` when the caliber name already says the type.
// "high-autonomy quartz" + "quartz" is the same word twice. "quartz" + "quartz"
// is the same word twice. "Tough Solar quartz module" + "solar quartz" is
// close enough to redundant. Default is to show both.
function movementLabel(card: Card): string {
  const c = (card.identity.movement.caliber ?? '').trim()
  const t = (card.identity.movement.type ?? '').trim()
  if (!c) return t || '—'
  if (!t) return c
  const cLow = c.toLowerCase()
  const tLow = t.toLowerCase()
  if (cLow === tLow) return c
  // If the type is a substring of the caliber (e.g. "quartz" inside
  // "high-autonomy quartz"), the caliber already carries the type.
  if (cLow.includes(tLow)) return c
  return `${c} · ${t}`
}

function scarcitySignals(card: Card): string[] {
  const signals = [
    card.identity.produced.discontinued
      ? `Supply is closed: production ended in ${card.identity.produced.end_year}.`
      : 'Supply is still open: production continues.',
  ]
  if (card.scarcity_public.limited_edition.is_limited) {
    signals.push(card.scarcity_public.limited_edition.stated_size
      ? `The maker stated an edition of ${card.scarcity_public.limited_edition.stated_size.toLocaleString()} pieces.`
      : 'The maker calls it limited, but did not publish the edition size.')
  } else {
    signals.push('It was not sold as a numbered limited edition.')
  }
  signals.push(card.scarcity_public.waitlist_evidence_n > 0
    ? `${card.scarcity_public.waitlist_evidence_n} sourced waitlist signal${card.scarcity_public.waitlist_evidence_n === 1 ? '' : 's'} inform demand pressure.`
    : 'No sourced waitlist claim is being used.')
  return signals
}

function conversationPrompt(card: Card): string {
  if (card.scarcity_public.limited_edition.is_limited) {
    return 'Does numbering an object make it more meaningful, or only easier to market?'
  }
  if (card.identity.produced.discontinued) {
    return 'Why do we often want an object more once nobody can make another one?'
  }
  if (card.provenance_events.length > 0) {
    return 'Can a famous owner genuinely change an object’s meaning, or only its price?'
  }
  return 'What turns an excellent tool into something people choose to collect?'
}
