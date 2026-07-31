import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadRolexCatalog, loadScreenSightings, type RolexCatalog, type ScreenSnapshot } from '../lib/catalog.ts'

const PATHS = [
  { label: 'Read the theories', title: 'About the Register', body: 'The four theories, the honesty ladder, the horology timeline, and the code for what to buy.', to: '/about', action: 'OPEN THE ABOUT' },
  { label: 'Look closely', title: 'The Rolex object atlas', body: 'Eighty source-linked configurations. Study the dial, bezel, bracelet, and the price the catalog actually showed.', to: '/photos', action: 'OPEN THE ATLAS' },
  { label: 'Spot the co-star', title: 'Rolex on screen', body: 'From Top Gun: Maverick to The White Lotus—reported sightings, exact matches, and uncertainty left visible.', to: '/screen', action: 'SEE THE SIGHTINGS' },
  { label: 'Ask the awkward question', title: 'Scarcity or attention?', body: 'Separate fixed supply from cultural exposure. Explore the signal without turning it into a price promise.', to: '/economy', action: 'OPEN THE LAB' },
  { label: 'Pass it on well', title: 'Find the next custodian', body: 'Build an honest handover brief around condition, care, and history—not sales theatre.', to: '/rehome', action: 'MAKE A BRIEF' },
]

export default function Home() {
  const data = useDataset()
  const [catalog, setCatalog] = useState<RolexCatalog | null>(null)
  const [screen, setScreen] = useState<ScreenSnapshot | null>(null)
  useEffect(() => { Promise.all([loadRolexCatalog(), loadScreenSightings()]).then(([c, s]) => { setCatalog(c); setScreen(s) }) }, [])
  if (!data) return null

  const hero = catalog?.records.find((item) => item.reference === '126000') ?? catalog?.records[0]
  const fact = screen?.sightings.find((item) => item.id.includes('jennifer-connelly')) ?? screen?.sightings[0]
  const withComps = data.cards.filter((card) => card.comp_summary).length
  const withMedia = data.cards.filter((card) => card.media.length).length

  return (
    <>
      <section className="atelier-hero">
        <div className="atelier-copy">
          <p className="eyebrow">THE WATCH REGISTER · AN OPEN ATELIER</p>
          <h1>
            <span className="hero-line">Serious objects.</span>
            <span className="hero-line"><em>Curious company.</em></span>
          </h1>
          <p className="home-lede">
            Learn a watch for the fun of it. Understand scarcity without swallowing the hype.
            Find a loving object its next home. Leave dinner with a better story.
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/about">READ THE ABOUT →</Link>
            <Link className="text-link mono" to="/register">ALL {data.count} DOSSIERS</Link>
            <Link className="text-link mono" to="/discover">SPIN ROULETTE</Link>
          </div>
        </div>
        <div className="hero-object-card">
          {hero ? <><a href={hero.source_url} target="_blank" rel="noreferrer"><img src={hero.image_url} alt={hero.name} /></a><p className="mono micro">{hero.configuration_reference} · SOURCE-LINKED CATALOG IMAGE</p></> : <div className="empty-photo">OBJECT IMAGE<br />LOADING</div>}
          {fact && <div className="fact-bubble hero-bubble"><span className="bubble-kicker mono">DID YOU KNOW?</span><strong>{fact.watch}</strong><span>{fact.description}</span><Link to="/screen">ROLL CREDITS →</Link></div>}
        </div>
      </section>

      <section className="reference-ticker" aria-label="A taste of the register">
        <p className="eyebrow">A TASTE OF THE REGISTER</p>
        <div className="ticker-strip mono">
          {[...data.cards].slice(0, 24).map((c) => (
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
        <div><strong>{catalog?.count ?? '—'}</strong><span>sourced Rolex catalog records</span></div>
        <div><strong>{screen?.screen_count ?? '—'}</strong><span>film &amp; TV sightings</span></div>
        <div><strong>{withComps}</strong><span>references with sale evidence</span></div>
      </section>

      <section className="lookbook-paths">
        <div className="section-rule"><h2>Choose a curiosity.</h2><span className="sticker-inline mono">PLAY FIRST · NUMBERS SECOND</span></div>
        <div className="lookbook-grid">
          {PATHS.map((path, index) => <Link className={`lookbook-card tone-${index + 1}`} to={path.to} key={path.to}><span className="eyebrow">{path.label}</span><h3>{path.title}</h3><p>{path.body}</p><span className="mono micro">{path.action} →</span></Link>)}
        </div>
      </section>

      <section className="research-ledger">
        <div><p className="eyebrow">THE UNFINISHED LEDGER</p><h2>Polish is not proof.</h2><p className="dim">The gaps are part of the interface. They show exactly where the research must deepen.</p></div>
        <div className="ledger-lines mono">
          <p><span>Verified comp coverage</span><strong>{withComps} / {data.count}</strong></p>
          <p><span>Reference-matched catalog media</span><strong>{withMedia} / {data.count}</strong></p>
          <p><span>Exact Rolex screen mappings</span><strong>{screen?.sightings.filter((item) => item.match_level === 'exact_reference').length ?? '—'} / {screen?.count ?? '—'}</strong></p>
          <p className="crossed"><span>Hype premium</span><strong>AWAITING A VALID COHORT</strong></p>
        </div>
      </section>
    </>
  )
}
