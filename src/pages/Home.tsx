import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDataset } from '../lib/dataset-context.ts'
import { loadRolexCatalog, loadScreenSightings, type RolexCatalog, type ScreenSnapshot } from '../lib/catalog.ts'
import type { Card } from '../lib/data.ts'

/**
 * Pick a cross-section of references that gives a reader the depth of the
 * register at a glance — Rolex first (crown-tier anchor), then every other
 * brand in alphabetical order, one card at a time, until we hit 24. The
 * ticker is the first thing most readers see; it should read as a deliberate
 * cross-section, not "the first N cards of the biggest brand".
 */
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
  {
    label: 'Spot the co-star',
    title: 'Watches on screen',
    body: 'McQueen\'s Monaco, Bond\'s Seamaster, Marty\'s Casio — credited stills, honest IDs, no fake scarcity from fame.',
    stat: '45 sightings · 14 iconic stills',
    to: '/screen', action: 'OPEN ON SCREEN',
  },
  {
    label: 'Look closely',
    title: 'The Rolex object atlas',
    body: 'Eighty source-linked configurations. Dial, bezel, bracelet, and the catalog price as published.',
    stat: '80 catalog records · 1 source each',
    to: '/photos', action: 'OPEN THE ATLAS',
  },
  {
    label: 'Ask the awkward question',
    title: 'Scarcity or attention?',
    body: 'Separate fixed supply from cultural exposure. Explore the signal without a price promise.',
    stat: '0 invented prices',
    to: '/economy', action: 'OPEN THE LAB',
  },
  {
    label: 'Pass it on well',
    title: 'Find the next custodian',
    body: 'Build an honest handover brief around condition, care, and history — not sales theatre.',
    stat: '6-step handover brief',
    to: '/rehome', action: 'MAKE A BRIEF',
  },
  {
    label: 'Read the method',
    title: 'About Time Pop',
    body: 'Theories, honesty ladder, timeline, and what we refuse to invent.',
    stat: 'methodology v2',
    to: '/about', action: 'READ ABOUT',
  },
]

/** Most-recently-curated screen sightings, used to populate the marquee. */
function topScreenPicks(snapshot: ScreenSnapshot | null, limit = 5): { title: string; meta: string; href: string }[] {
  if (!snapshot) return []
  return snapshot.sightings
    .filter((s) => s.media)
    .slice(0, limit)
    .map((s) => ({
      title: s.title,
      meta: `${s.media_type.toUpperCase()} · ${s.release_year ?? '—'} · ${s.identification.toUpperCase()}`,
      href: `/screen#${s.id}`,
    }))
}

/** A few real cards the user might want to land on, each picked because its
 *  dossier is currently the deepest in its brand. */
function spotlightDossiers(cards: Card[]): Card[] {
  // Pick one crown / one trinity / one haute / one core / one attainable.
  const tiers: Card['identity']['tier'][] = ['trinity', 'crown', 'haute', 'core', 'attainable']
  const out: Card[] = []
  for (const tier of tiers) {
    const withImg = cards.find((c) => c.identity.tier === tier && c.media.length > 0 && c.comp_summary)
    if (withImg) out.push(withImg)
  }
  return out
}

export default function Home() {
  const data = useDataset()
  const [catalog, setCatalog] = useState<RolexCatalog | null>(null)
  const [screen, setScreen] = useState<ScreenSnapshot | null>(null)
  useEffect(() => { Promise.all([loadRolexCatalog(), loadScreenSightings()]).then(([c, s]) => { setCatalog(c); setScreen(s) }) }, [])
  if (!data) return null

  const withComps = data.cards.filter((card) => card.comp_summary).length
  const withMedia = data.cards.filter((card) => card.media.length).length
  const stills = screen?.sightings.filter((s) => s.media).length ?? 0
  const screenPicks = useMemo(() => topScreenPicks(screen), [screen])
  const spotlight = useMemo(() => spotlightDossiers(data.cards), [data])
  const ticker = useMemo(() => tasteOfRegister(data.cards), [data])
  const asiaPicks = useMemo(() => data.cards.filter((c) => {
    const asianBrands = new Set(['Casio', 'Citizen', 'Credor', 'Grand Seiko', 'Hajime Asaoka',
      'King Seiko', 'Kurono Tokyo', 'Minase', 'Naoya Hida', 'Seiko'])
    return asianBrands.has(c.identity.brand) && c.media.length > 0
  }).slice(0, 4), [data])
  const brassTacks = useMemo(() => {
    // For buyers: a couple of fully-stocked dossiers worth starting with.
    const withProvenanceAndComps = data.cards.filter((c) => c.comp_summary && c.provenance_events.length >= 2)
    return withProvenanceAndComps
      .sort((a, b) => b.comp_summary!.n - a.comp_summary!.n)
      .slice(0, 5)
  }, [data])

  return (
    <>
      <section className="timepop-hero" aria-label="Time Pop — home">
        <div className="timepop-hero-copy">
          <p className="eyebrow">TIME POP · A LIVING ARCHIVE OF WATCHES</p>
          <h1 className="timepop-title">Watches,<br />on their own terms.</h1>
          <p className="home-lede">
            A free, evidence-first register of {data.count} luxury and collectible references.
            Cited comps, sourced provenance, credited on-screen stills — and the honesty
            ladder that shows where we refuse to estimate.
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/register">BROWSE THE {data.count} OBJECTS →</Link>
            <Link className="btn secondary" to="/screen">SEE IT ON SCREEN</Link>
          </div>
          <p className="mono micro dim hero-trust">
            {stills} CREDITED STILLS · {withComps} DOSSIERS WITH SALE EVIDENCE · 0 INVENTED PRICES · {data.built} BUILD
          </p>
        </div>
        <div className="timepop-hero-art" role="img" aria-label="Pop-art collage of watches in film">
          <img
            src="/img/hero/time-pop-banner.png"
            alt="Pop-art collage of iconic watches and film moments — Bond, McQueen, Marty McFly, and more"
            loading="eager"
          />
          <p className="mono micro hero-art-credit">
            HERO ART · EDITORIAL COLLAGE · FILM STILLS CREDITED ON /SCREEN
          </p>
        </div>
      </section>

      <section className="reference-ticker" aria-label="A taste of the archive">
        <div className="ticker-head">
          <p className="eyebrow">A TASTE OF THE ARCHIVE</p>
          <p className="ticker-meta mono">24 references · {new Set(data.cards.map((c) => c.identity.brand)).size} brands · last build {data.built}</p>
        </div>
        <div className="ticker-strip">
          {ticker.map((c) => {
            const m = c.media[0]
            return (
              <Link key={c.id} to={`/w/${c.id}`} className="ticker-cell">
                <span className="ticker-thumb">
                  {m ? <img src={m.url} alt={c.identity.name} loading="lazy" /> : <span className="dim">—</span>}
                </span>
                <span className="ticker-brand">{c.identity.brand.toUpperCase()}</span>
                <span className="ticker-ref">{c.identity.reference}</span>
                <span className="ticker-name">{c.identity.name}</span>
                {c.comp_summary && <span className="ticker-evidence mono">{c.comp_summary.n} COMPS</span>}
              </Link>
            )
          })}
        </div>
      </section>

      <section className="proof-ribbon" aria-label="Research coverage">
        <div><strong>{data.count}</strong><span>object dossiers</span></div>
        <div><strong>{catalog?.count ?? '—'}</strong><span>Rolex catalog records</span></div>
        <div><strong>{screen?.count ?? '—'}</strong><span>film &amp; TV sightings</span></div>
        <div><strong>{stills}</strong><span>credited on-screen stills</span></div>
      </section>

      <section className="spotlight-row" aria-label="Spotlight dossiers">
        <div className="section-rule">
          <h2>Start with a fully-stocked dossier.</h2>
          <span className="sticker-inline mono">FIVE REFERENCES · ALL TIER · ALL WITH COMPS</span>
        </div>
        <div className="spotlight-grid">
          {spotlight.map((c) => (
            <Link key={c.id} to={`/w/${c.id}`} className="spotlight-card">
              <span className="spotlight-media">
                {c.media[0]
                  ? <img src={c.media[0].url} alt={c.identity.name} loading="lazy" />
                  : <span className="dim">NO PHOTO YET</span>}
              </span>
              <span className="spotlight-id">
                <span className="mono">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                <span className="eyebrow">{c.identity.collection}</span>
              </span>
              <span className="spotlight-name">{c.identity.name}</span>
              <span className="spotlight-stats mono">
                {c.comp_summary ? <>{c.comp_summary.n} COMPS · {c.comp_summary.venues.length} VENUES</> : '—'}
                {c.provenance_events.length > 0 && <> · {c.provenance_events.length} EVENTS</>}
              </span>
              <span className="spotlight-read mono">OPEN DOSSIER →</span>
            </Link>
          ))}
        </div>
      </section>

      {asiaPicks.length > 0 && (
        <section className="asia-spotlight" aria-label="Asian-market references">
          <div className="section-rule">
            <h2>Asia on Time Pop.</h2>
            <span className="sticker-inline mono">JDM · HK AD QUEUES · TOKYO INDEPENDENTS</span>
          </div>
          <div className="asia-spotlight-grid">
            {asiaPicks.map((c) => (
              <Link key={c.id} to={`/w/${c.id}`} className="asia-spotlight-card">
                <span className="asia-spotlight-media">
                  {c.media[0]
                    ? <img src={c.media[0].url} alt={c.identity.name} loading="lazy" />
                    : <span className="dim">NO PHOTO YET</span>}
                </span>
                <span className="asia-spotlight-id mono">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                <span className="asia-spotlight-name">{c.identity.name}</span>
                {c.identity.nickname && <span className="asia-spotlight-nick">“{c.identity.nickname}”</span>}
                <span className="asia-spotlight-tier mono">{c.identity.tier.toUpperCase()}</span>
              </Link>
            ))}
            <Link to="/register?region=asia" className="asia-spotlight-card asia-spotlight-all">
              <span className="asia-spotlight-all-eyebrow mono">FILTER</span>
              <span className="asia-spotlight-all-title">SEE ALL ASIA</span>
              <span className="asia-spotlight-all-body">
                Casio, Citizen, Credor, Grand Seiko, Seiko, King Seiko, Kurono, Minase, Naoya Hida, Hajime Asaoka.
              </span>
              <span className="asia-spotlight-all-link mono">→ REGISTER (REGION: ASIA)</span>
            </Link>
          </div>
        </section>
      )}

      <section className="lookbook-paths">
        <div className="section-rule">
          <h2>Choose a curiosity.</h2>
          <span className="sticker-inline mono">PLAY FIRST · NUMBERS SECOND</span>
        </div>
        <div className="lookbook-grid">
          {PATHS.map((path, index) => (
            <Link className={`lookbook-card tone-${(index % 4) + 1}`} to={path.to} key={path.to}>
              <span className="eyebrow">{path.label}</span>
              <h3>{path.title}</h3>
              <p>{path.body}</p>
              <span className="lookbook-stat mono">{path.stat}</span>
              <span className="mono micro">{path.action} →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="brass-tacks" aria-label="Where to start">
        <div className="section-rule">
          <h2>For buyers and sellers.</h2>
          <span className="sticker-inline mono">CARD-BY-CARD ENTRY POINTS</span>
        </div>
        <div className="brass-tacks-grid">
          <article className="brass-card">
            <span className="eyebrow">FOR THE BUYER</span>
            <h3>What you are looking at.</h3>
            <p>Start with a reference you already have or are considering. Each dossier shows the dossier portrait, the comp evidence, the producer\'s catalogue history, and the screen record. The honesty ladder explains what is shown and what is deliberately hidden.</p>
            <ol className="brass-list mono">
              <li>1. Read the <strong>one-liner</strong> and the <strong>case</strong> row.</li>
              <li>2. Compare <strong>market</strong> to <strong>retail</strong> (with the stale-baseline flag).</li>
              <li>3. Check <strong>comps</strong> — same metal, same family, sourced URL.</li>
              <li>4. Read <strong>provenance</strong> for cultural moments, not price signal.</li>
            </ol>
            <Link className="mono" to="/discover">SPIN THE ROULETTE →</Link>
          </article>
          <article className="brass-card">
            <span className="eyebrow">FOR THE SELLER</span>
            <h3>What you are hoping to let go.</h3>
            <p>The handover brief is a six-step form built around condition, care, and history — not sales theatre. We do not broker transactions, hold funds, or authenticate watches. We supply the dossier; you supply the truth.</p>
            <ol className="brass-list mono">
              <li>1. <strong>Photograph</strong> every side and every wear mark.</li>
              <li>2. <strong>Separate</strong> receipts and service records from family stories.</li>
              <li>3. <strong>Disclose</strong> interventions, replaced parts, water damage.</li>
              <li>4. <strong>Protect</strong> the buyer with authentication and insured delivery.</li>
            </ol>
            <Link className="mono" to="/rehome">MAKE A BRIEF →</Link>
          </article>
        </div>
      </section>

      {screenPicks.length > 0 && (
        <section className="screen-marquee" aria-label="On screen right now">
          <div className="section-rule">
            <h2>On screen this month.</h2>
            <span className="sticker-inline mono">CREDITED STILLS · 14 ICONIC FILMS</span>
          </div>
          <ul className="marquee-list">
            {screenPicks.map((p, i) => (
              <li key={i}>
                <Link to={p.href} className="marquee-link">
                  <span className="marquee-eyebrow mono">{p.meta}</span>
                  <span className="marquee-title">{p.title}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link to="/screen" className="marquee-link marquee-link-all">
                <span className="marquee-eyebrow mono">ALL</span>
                <span className="marquee-title">Open the full screen →</span>
              </Link>
            </li>
          </ul>
        </section>
      )}

      {brassTacks.length > 0 && (
        <section className="starter-row" aria-label="Five fully-stocked dossiers to start with">
          <div className="section-rule">
            <h2>Five dossiers worth starting with.</h2>
            <span className="sticker-inline mono">SOURCED COMPS · SOURCED PROVENANCE</span>
          </div>
          <ul className="starter-list">
            {brassTacks.map((c) => (
              <li key={c.id}>
                <Link to={`/w/${c.id}`} className="starter-link">
                  <span className="starter-num mono">{String(brassTacks.indexOf(c) + 1).padStart(2, '0')}</span>
                  <span className="starter-id">
                    <span className="eyebrow">{c.identity.brand.toUpperCase()} · {c.identity.reference}</span>
                    <span className="starter-name">{c.identity.name}</span>
                  </span>
                  <span className="starter-stats mono">
                    {c.comp_summary?.n ?? '—'} COMPS · {c.provenance_events.length} EVENTS
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="research-ledger">
        <div>
          <p className="eyebrow">THE UNFINISHED LEDGER</p>
          <h2>Polish is not proof.</h2>
          <p className="dim">Gaps stay visible. That is how you know what still needs research.</p>
        </div>
        <div className="ledger-lines mono">
          <p><span>Verified comp coverage</span><strong>{withComps} / {data.count}</strong></p>
          <p><span>Reference-matched catalog media</span><strong>{withMedia} / {data.count}</strong></p>
          <p><span>Provenance events</span><strong>{data.cards.reduce((s, c) => s + c.provenance_events.length, 0)} / —</strong></p>
          <p><span>On-screen stills with credits</span><strong>{stills} / {screen?.count ?? '—'}</strong></p>
          <p className="crossed"><span>Hype premium</span><strong>AWAITING A VALID COHORT</strong></p>
        </div>
      </section>
    </>
  )
}
