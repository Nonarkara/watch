import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadRolexCatalog, loadScreenSightings, type RolexCatalog, type ScreenSnapshot } from '../lib/catalog.ts'
import type { Card } from '../lib/data.ts'

function tasteOfRegister(cards: Card[]): Card[] {
  const byBrand = new Map<string, Card[]>()
  for (const c of cards) {
    const list = byBrand.get(c.identity.brand) ?? []
    list.push(c)
    byBrand.set(c.identity.brand, list)
  }
  const sortedBrands = [...byBrand.keys()].sort((a, b) => {
    if (a === 'Rolex') return -1
    if (b === 'Rolex') return 1
    return a.localeCompare(b)
  })
  const out: Card[] = []
  let added = true
  while (added && out.length < 24) {
    added = false
    for (const brand of sortedBrands) {
      const list = byBrand.get(brand)!
      if (out.length >= 24) break
      const next = list.shift()
      if (next) {
        out.push(next)
        added = true
      }
    }
  }
  return out
}

const PATHS = [
  { label: 'Spot the co-star', title: 'Watches on screen', body: 'McQueen’s Monaco, Bond’s Seamaster, Marty’s Casio — credited stills, honest IDs, no fake scarcity from fame.', to: '/screen', action: 'OPEN ON SCREEN' },
  { label: 'Look closely', title: 'The Rolex object atlas', body: 'Eighty source-linked configurations. Dial, bezel, bracelet, and the catalog price as published.', to: '/photos', action: 'OPEN THE ATLAS' },
  { label: 'Ask the awkward question', title: 'Scarcity or attention?', body: 'Separate fixed supply from cultural exposure. Explore the signal without a price promise.', to: '/economy', action: 'OPEN THE LAB' },
  { label: 'Pass it on well', title: 'Find the next custodian', body: 'Build an honest handover brief around condition, care, and history — not sales theatre.', to: '/rehome', action: 'MAKE A BRIEF' },
  { label: 'Read the method', title: 'About Time Pop', body: 'Theories, honesty ladder, timeline, and what we refuse to invent.', to: '/about', action: 'READ ABOUT' },
]

export default function Home() {
  const data = useDataset()
  const [catalog, setCatalog] = useState<RolexCatalog | null>(null)
  const [screen, setScreen] = useState<ScreenSnapshot | null>(null)
  useEffect(() => { Promise.all([loadRolexCatalog(), loadScreenSightings()]).then(([c, s]) => { setCatalog(c); setScreen(s) }) }, [])
  if (!data) return null

  const withComps = data.cards.filter((card) => card.comp_summary).length
  const withMedia = data.cards.filter((card) => card.media.length).length
  const stills = screen?.sightings.filter((s) => s.media).length ?? 0

  return (
    <>
      <section className="timepop-hero" aria-label="Time Pop">
        <div className="timepop-hero-copy">
          <p className="eyebrow">TIME POP · A LIVING ARCHIVE OF WATCHES</p>
          <h1 className="timepop-title">Time Pop</h1>
          <p className="home-lede">
            Serious objects. Curious company. Learn a watch for the fun of it, see it on screen with credits,
            and separate scarcity from hype — then pass it on cleanly.
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/screen">WATCHES IN FILM →</Link>
            <Link className="btn secondary" to="/register">BROWSE {data.count} OBJECTS</Link>
            <Link className="text-link mono" to="/rehome">SELL / REHOME</Link>
          </div>
          <p className="mono micro dim hero-trust">
            {stills} CREDITED STILLS · {withComps} WITH SALE EVIDENCE · 0 INVENTED PRICES
          </p>
        </div>
        <div className="timepop-hero-art" role="img" aria-label="Pop-art collage of watches in film">
          <img
            src="/img/hero/time-pop-banner.png"
            alt="Pop-art collage of iconic watches and film moments — Bond, McQueen, Marty McFly, and more"
          />
          <p className="mono micro hero-art-credit">
            HERO ART · EDITORIAL COLLAGE · FILM STILLS CREDITED ON /SCREEN
          </p>
        </div>
      </section>

      <section className="reference-ticker" aria-label="A taste of the archive">
        <p className="eyebrow">A TASTE OF THE ARCHIVE</p>
        <div className="ticker-strip mono">
          {tasteOfRegister(data.cards).map((c) => (
            <Link key={c.id} to={`/w/${c.id}`} className="ticker-cell">
              <span className="ticker-brand">{c.identity.brand.toUpperCase()}</span>
              <span className="ticker-ref">{c.identity.reference}</span>
              <span className="ticker-name">{c.identity.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="proof-ribbon" aria-label="Research coverage">
        <div><strong>{data.count}</strong><span>object dossiers</span></div>
        <div><strong>{catalog?.count ?? '—'}</strong><span>Rolex catalog records</span></div>
        <div><strong>{screen?.count ?? '—'}</strong><span>film &amp; TV sightings</span></div>
        <div><strong>{stills}</strong><span>credited on-screen stills</span></div>
      </section>

      <section className="lookbook-paths">
        <div className="section-rule"><h2>Choose a curiosity.</h2><span className="sticker-inline mono">PLAY FIRST · NUMBERS SECOND</span></div>
        <div className="lookbook-grid">
          {PATHS.map((path, index) => (
            <Link className={`lookbook-card tone-${(index % 4) + 1}`} to={path.to} key={path.to}>
              <span className="eyebrow">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="mono micro">{path.action} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="research-ledger">
        <div>
          <p className="eyebrow">THE UNFINISHED LEDGER</p>
          <h2>Polish is not proof.</h2>
          <p className="dim">Gaps stay visible. That is how you know what still needs research.</p>
        </div>
        <div className="ledger-lines mono">
          <p><span>Verified comp coverage</span><strong>{withComps} / {data.count}</strong></p>
          <p><span>Reference-matched catalog media</span><strong>{withMedia} / {data.count}</strong></p>
          <p><span>On-screen stills with credits</span><strong>{stills} / {screen?.count ?? '—'}</strong></p>
          <p className="crossed"><span>Hype premium</span><strong>AWAITING A VALID COHORT</strong></p>
        </div>
      </section>
    </>
  )
}
